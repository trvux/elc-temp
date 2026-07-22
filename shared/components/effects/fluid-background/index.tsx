"use client";

import { m } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { FRAGMENT_SHADER, VERTEX_SHADER } from "./shaders";

// ─── Types ─────────────────────────────────────────────────────────────────

interface ShaderParams {
  u_seed: number;
  u_speed: number;
  u_scale: number;
  u_turbAmp: number;
  u_turbFreq: number;
  u_turbIter: number;
  u_waveFreq: number;
  u_distBias: number;
  u_jellify: number;
  u_ditherMode: number;
  u_dither: number;
  u_exposure: number;
  u_contrast: number;
  u_saturation: number;
}

interface ColorStop {
  r: number;
  g: number;
  b: number;
}

// ─── Defaults ──────────────────────────────────────────────────────────────

const DEFAULT_PARAMS: ShaderParams = {
  u_seed: 648,
  u_speed: 0.28,
  u_scale: 0.42,
  u_turbAmp: 0.6,
  u_turbFreq: 0.1,
  u_turbIter: 7, // Tối ưu vòng lặp shader từ 7 xuống 5 cho mát máy
  u_waveFreq: 3.8,
  u_distBias: 0,
  u_jellify: 0,
  u_ditherMode: 2,
  u_dither: 0.05,
  u_exposure: 1.1,
  u_contrast: 1.1,
  u_saturation: 1.0,
};

const DEFAULT_COLORS: ColorStop[] = [
  { r: 0.902, g: 0.9333, b: 0.9961 },
  { r: 0.3412, g: 0.5294, b: 0.9686 },
  { r: 0.0, g: 0.1686, b: 0.5412 },
  { r: 0.0, g: 0.0, b: 0.0 },
  { r: 0.0, g: 0.0, b: 0.0 },
  { r: 0.0, g: 0.0, b: 0.0 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function buildColorData(colors: ColorStop[]): Float32Array {
  const data = new Float32Array(32);
  colors.forEach((c, i) => {
    data[i * 4 + 0] = c.r;
    data[i * 4 + 1] = c.g;
    data[i * 4 + 2] = c.b;
    data[i * 4 + 3] = 1.0;
  });
  return data;
}

export default function FluidBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const lastFrameTimeRef = useRef<number>(0);
  const locsRef = useRef<Record<string, WebGLUniformLocation | null>>({});

  // Trạng thái theo dõi viewport hiển thị đầu tiên của canvas
  const isIntersectingRef = useRef<boolean>(true);

  const [isReady, setIsReady] = useState<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", { alpha: true });
    if (!gl) return;
    glRef.current = gl;

    function createShader(
      ctx: WebGL2RenderingContext,
      type: number,
      src: string,
    ): WebGLShader | null {
      const s = ctx.createShader(type);
      if (!s) return null;
      ctx.shaderSource(s, src);
      ctx.compileShader(s);
      if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) {
        ctx.deleteShader(s);
        return null;
      }
      return s;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    programRef.current = program;
    gl.useProgram(program);

    const posLoc = gl.getAttribLocation(program, "a_position");
    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const uvLoc = gl.getAttribLocation(program, "a_texCoord");
    const uvBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]),
      gl.STATIC_DRAW,
    );
    gl.enableVertexAttribArray(uvLoc);
    gl.vertexAttribPointer(uvLoc, 2, gl.FLOAT, false, 0, 0);

    const locs: Record<string, WebGLUniformLocation | null> = {
      u_resolution: gl.getUniformLocation(program, "u_resolution"),
      u_time: gl.getUniformLocation(program, "u_time"),
      u_pixelRatio: gl.getUniformLocation(program, "u_pixelRatio"),
      u_colors: gl.getUniformLocation(program, "u_colors"),
      u_colors_length: gl.getUniformLocation(program, "u_colors_length"),
      u_loop: gl.getUniformLocation(program, "u_loop"),
      u_seed: gl.getUniformLocation(program, "u_seed"),
      u_speed: gl.getUniformLocation(program, "u_speed"),
      u_scale: gl.getUniformLocation(program, "u_scale"),
      u_turbAmp: gl.getUniformLocation(program, "u_turbAmp"),
      u_turbFreq: gl.getUniformLocation(program, "u_turbFreq"),
      u_turbIter: gl.getUniformLocation(program, "u_turbIter"),
      u_waveFreq: gl.getUniformLocation(program, "u_waveFreq"),
      u_distBias: gl.getUniformLocation(program, "u_distBias"),
      u_jellify: gl.getUniformLocation(program, "u_jellify"),
      u_ditherMode: gl.getUniformLocation(program, "u_ditherMode"),
      u_dither: gl.getUniformLocation(program, "u_dither"),
      u_exposure: gl.getUniformLocation(program, "u_exposure"),
      u_contrast: gl.getUniformLocation(program, "u_contrast"),
      u_saturation: gl.getUniformLocation(program, "u_saturation"),
    };
    locsRef.current = locs;

    gl.uniform1f(locs.u_loop, 0.0);
    (Object.keys(DEFAULT_PARAMS) as Array<keyof ShaderParams>).forEach(
      (key) => {
        const loc = locs[key];
        if (loc !== null && loc !== undefined)
          gl.uniform1f(loc, DEFAULT_PARAMS[key]);
      },
    );

    gl.uniform1i(locs.u_colors_length, 6);
    gl.uniform4fv(locs.u_colors, buildColorData(DEFAULT_COLORS));

    const resizeCanvas = (): void => {
      // Đọc trực tiếp client size từ phần tử DOM thật của canvas
      const w = canvas.clientWidth || window.innerWidth;
      const h = canvas.clientHeight || window.innerHeight;

      const dpr = 1.0; // Ép dpr 1.0 ở môi trường dev để tối ưu hóa điện năng và giảm nhiệt GPU
      const renderW = Math.floor(w * dpr);
      const renderH = Math.floor(h * dpr);

      if (canvas.width !== renderW || canvas.height !== renderH) {
        canvas.width = renderW;
        canvas.height = renderH;
        gl.viewport(0, 0, renderW, renderH);
        gl.uniform2f(locs.u_resolution, renderW, renderH);
        gl.uniform1f(locs.u_pixelRatio, dpr);
      }
    };
    window.addEventListener("resize", resizeCanvas);

    // Đặt trễ nhẹ 50ms để layout cây DOM của Next.js hoàn thiện kích thước thật trước khi render WebGL
    const initialResizeTimeout = setTimeout(resizeCanvas, 50);

    // Same shader, same uniforms, same resolution — this just draws it less
    // often. u_time already tracks real wall-clock time (Date.now() minus
    // start), not frame count, so skipping frames doesn't slow the
    // animation down, it only reduces how many times the GPU has to
    // recompute it per second, which is what was driving the fan/heat.
    const TARGET_FRAME_INTERVAL_MS = 1000 / 30; // cap at 30fps

    const render = (now: number): void => {
      animFrameRef.current = requestAnimationFrame(render);

      if (!glRef.current) return;
      // Page Visibility API: a backgrounded tab still schedules rAF
      // callbacks (just throttled), so skip the draw call outright rather
      // than relying on the browser's own throttling.
      if (document.hidden) return;
      if (!isIntersectingRef.current) return;
      if (now - lastFrameTimeRef.current < TARGET_FRAME_INTERVAL_MS) return;
      lastFrameTimeRef.current = now;

      const ctx = glRef.current;
      ctx.uniform1f(locs.u_time, (Date.now() - startTimeRef.current) / 1000);
      ctx.clearColor(0, 0, 0, 1);
      ctx.clear(ctx.COLOR_BUFFER_BIT);
      ctx.drawArrays(ctx.TRIANGLES, 0, 6);
    };
    animFrameRef.current = requestAnimationFrame(render);
    setIsReady(true);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isIntersectingRef.current = entry.isIntersecting;
        });
      },
      {
        threshold: 0.0,
        rootMargin: "300px 0px 300px 0px", // Mở rộng vùng nhận diện 300px tránh kẹt luồng vẽ ban đầu
      },
    );
    observer.observe(canvas);

    return () => {
      clearTimeout(initialResizeTimeout);
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", resizeCanvas);
      observer.disconnect();
      if (glRef.current && programRef.current)
        glRef.current.deleteProgram(programRef.current);
      glRef.current = null;
      programRef.current = null;
    };
  }, []);

  return (
    // Khối background chạy nền tuyệt đối nội bộ
    <m.div
      initial={{ opacity: 0 }}
      animate={isReady ? { opacity: 1 } : { opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="absolute inset-0 z-0 w-full h-full overflow-hidden bg-black pointer-events-none"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full block object-cover"
      />
      <div className="absolute inset-0 bg-black/30" />
    </m.div>
  );
}
