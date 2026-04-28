import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Lock } from "lucide-react";

export const Route = createFileRoute("/download/$id")({
  component: DownloadPage,
});

type SessionData = {
  output_url: string | null;
  payment_status: string;
  layout: string | null;
};

function DownloadPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      const { data: row } = await supabase
        .from("sessions")
        .select("output_url,payment_status,layout")
        .eq("id", id)
        .maybeSingle();
      setData(row);
      setLoading(false);
    }
    fetch();
  }, [id]);

  if (loading) return <main className="min-h-screen flex items-center justify-center">โหลด...</main>;

  if (!data || data.payment_status !== "paid" || !data.output_url) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-heading font-bold mb-2">ยังเข้าไม่ได้</h1>
          <p className="text-muted-foreground mb-6">รอการชำระเงินยืนยันก่อนนะ</p>
          <Link to="/" className="text-primary underline">กลับหน้าแรก</Link>
        </div>
      </main>
    );
  }

  const ext = data.layout === "D" ? "gif" : "jpg";

  return (
    <main className="min-h-screen px-4 py-8 max-w-2xl mx-auto text-center">
      <h1 className="text-3xl font-heading font-bold mb-6">รูปของคุณพร้อมแล้ว 🎉</h1>
      <div className="bg-card p-3 rounded-3xl shadow-2xl inline-block mb-6 max-w-full">
        <img src={data.output_url} alt="output" className="rounded-2xl max-w-full" />
      </div>
      <div>
        <a
          href={data.output_url}
          download={`photobooth-${id.slice(0, 8)}.${ext}`}
          className="inline-flex items-center gap-2 h-14 px-8 rounded-full bg-primary text-primary-foreground font-semibold text-lg shadow-lg hover:scale-[1.03] transition"
        >
          <Download className="h-5 w-5" /> เซฟลงมือถือ 📲
        </a>
      </div>
    </main>
  );
}
