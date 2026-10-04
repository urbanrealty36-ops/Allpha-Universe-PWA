export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="pwa-offline-page">
      <div className="pwa-offline-orbit" aria-hidden="true" />
      <section className="pwa-offline-card" aria-labelledby="offline-title">
        <span className="pwa-offline-status">ALLPHA · OFFLINE</span>
        <h1 id="offline-title">Universe sementara tidak terhubung</h1>
        <p>
          Koneksi internet sedang tidak tersedia. Coba lagi saat jaringan kembali.
          Data dan operasi yang membutuhkan server tidak dijalankan ketika offline.
        </p>
        <button type="button" className="pwa-runtime-button" onClick={() => window.location.reload()}>
          Coba lagi
        </button>
      </section>
    </main>
  );
}
