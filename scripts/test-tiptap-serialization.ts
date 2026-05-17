import { Editor } from "@tiptap/core";
import { getTiptapExtensions } from "../shared/lib/tiptap-shared";

async function testTiptap() {
  const extensions = getTiptapExtensions();
  
  console.log("Initializing headless editor with identical extensions...");
  const editor = new Editor({
    extensions,
    content: "<p>testing nè</p>",
  });

  console.log("Original JSON:", JSON.stringify(editor.getJSON(), null, 2));

  console.log("\nSelecting the paragraph and toggling H2...");
  editor.chain().focus().selectAll().toggleHeading({ level: 2 }).run();
  
  console.log("After toggling H2 JSON:", JSON.stringify(editor.getJSON(), null, 2));
  console.log("After toggling H2 HTML:", editor.getHTML());

  console.log("\nToggling back to H1...");
  editor.chain().focus().selectAll().toggleHeading({ level: 1 }).run();
  
  console.log("After toggling H1 JSON:", JSON.stringify(editor.getJSON(), null, 2));
  console.log("After toggling H1 HTML:", editor.getHTML());
}

testTiptap().catch(console.error);
