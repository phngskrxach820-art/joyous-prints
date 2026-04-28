import { createFileRoute, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/d/$id/$kind")({
  component: DownloadDirect,
});

function DownloadDirect() {
  const { id, kind } = Route.useParams();
  const [error, setError] = useState(false);

  useEffect(() => {
    async function go() {
      const k = kind === "gif" ? "gif" : "photo";
      const ext = k === "gif" ? "gif" : "jpg";
      const path = `${id}/output-${k}.${ext}`;
      const { data } = supabase.storage.from("photos").getPublicUrl(path);
      try {
        const res = await fetch(data.publicUrl);
        if (!res.ok) throw new Error("not found");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `heng-photobooth.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
      } catch {
        setError(true);
      }
    }
    go();
  }, [id, kind]);

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 text-center">
        <div>
          <p className="text-2xl mb-2">😅</p>
          <p className="text-lg">ไม่พบไฟล์ หรือลิงก์หมดอายุแล้ว</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 text-center">
      <div>
        <p className="text-2xl mb-2">📲</p>
        <p className="text-lg">กำลังเซฟไฟล์ลงเครื่อง...</p>
        <p className="text-sm text-muted-foreground mt-2">ถ้าไม่เริ่มอัตโนมัติ ลองรีเฟรชหน้านี้</p>
      </div>
    </main>
  );
}
