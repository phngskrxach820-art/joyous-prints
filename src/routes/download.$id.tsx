import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Download, Loader2 } from "lucide-react";

export const Route = createFileRoute("/download/$id")({
  component: DownloadPage,
});

function DownloadPage() {
  const { id } = Route.useParams();
  const [data, setData] = useState<{
    photo_url: string | null;
    payment_status: string;
    first_name: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("sessions")
      .select("photo_url, payment_status, first_name")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setData(data);
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </main>
    );

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">ไม่พบ session</h1>
          <p className="text-muted-foreground">ลิงก์อาจหมดอายุแล้ว</p>
        </div>
      </main>
    );
  }

  if (data.payment_status !== "paid") {
    return (
      <main className="min-h-screen flex items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold mb-2">ยังไม่ได้ชำระเงิน</h1>
          <p className="text-muted-foreground">กรุณาชำระเงินที่บูธก่อน</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-10 max-w-md mx-auto text-center">
      <p className="text-gold text-xs uppercase tracking-[0.3em] mb-3">Your photo</p>
      <h1 className="text-3xl font-bold mb-8">
        {data.first_name ? `${data.first_name}, รูปของคุณพร้อมแล้ว` : "รูปของคุณพร้อมแล้ว"}
      </h1>

      {data.photo_url ? (
        <img
          src={data.photo_url}
          alt="Your photo"
          className="w-full rounded-2xl shadow-gold mb-8 animate-fade-in"
        />
      ) : (
        <div className="aspect-square bg-card rounded-2xl flex items-center justify-center mb-8 border border-white/10">
          <p className="text-muted-foreground text-sm">รูปกำลังประมวลผล...</p>
        </div>
      )}

      {data.photo_url && (
        <a
          href={data.photo_url}
          download
          className="inline-flex items-center gap-3 h-14 px-10 rounded-full bg-gradient-gold text-primary-foreground font-semibold shadow-gold w-full justify-center"
        >
          <Download className="h-5 w-5" />
          ดาวน์โหลดรูป
        </a>
      )}
    </main>
  );
}
