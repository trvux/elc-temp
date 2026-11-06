// The prompts of a service's brief (what to send so staff can quote) are shown in
// two places: the Zalo message and the lead form. The form already has an upload
// step for drawings and photos, so a prompt that only asks for those ("Đã có bản vẽ
// mặt bằng chưa (gửi ảnh nếu có)", "Ảnh hoặc video lỗi nếu có") would ask the same
// thing twice there. The Zalo message keeps them: Zalo has no upload step.
const ASKED_BY_UPLOAD_STEP = /bản vẽ|ảnh|video/i;

export function briefPromptsForForm(prompts: string[]): string[] {
  return prompts.filter((prompt) => !ASKED_BY_UPLOAD_STEP.test(prompt));
}
