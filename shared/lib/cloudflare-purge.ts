/**
 * Xoa cache Cloudflare edge sau khi mutate du lieu.
 * revalidatePath/revalidateTag chi xoa cache o origin (Next.js) -- Cloudflare
 * khong biet du lieu da doi, van giu ban cu toi khi het TTL. Ham nay goi
 * Cloudflare Purge API de dong bo edge cache voi origin ngay lap tuc.
 *
 * Free plan khong ho tro purge theo tag/prefix -- chi co "purge by URL list"
 * (toi da 30 URL/lan) hoac "purge everything". Voi entity co nhieu bien the
 * URL (vd san pham/dich vu theo tung quan huyen) khong the liet ke het, dung
 * purge_everything cho don gian va an toan.
 */
export async function purgeCloudflareCache(urls?: string[]) {
  const zoneId = process.env.CLOUDFLARE_ZONE_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!zoneId || !token) return;

  const body =
    urls && urls.length > 0 && urls.length <= 30
      ? { files: urls }
      : { purge_everything: true };

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("purgeCloudflareCache failed:", res.status, await res.text());
    }
  } catch (error) {
    // Purge that bai khong duoc lam hong luong save cua admin
    console.error("purgeCloudflareCache error:", error);
  }
}
