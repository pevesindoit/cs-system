import React from 'react';

export const metadata = {
  title: 'Kebijakan Privasi - Pevesindo',
  description: 'Kebijakan Privasi Pevesindo',
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-lg shadow">
        <h1 className="text-3xl font-bold mb-6 text-gray-900">Kebijakan Privasi Pevesindo</h1>
        
        <div className="space-y-6 text-gray-700">
          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Pendahuluan</h2>
            <p>
              Halaman ini menjelaskan bagaimana Pevesindo mengumpulkan, menggunakan, dan memproses data pelanggan. Kami berkomitmen untuk melindungi privasi pelanggan kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Pengumpulan Data</h2>
            <p>
              Saat Anda menghubungi kami melalui WhatsApp, kami mengumpulkan informasi yang Anda berikan secara sukarela, termasuk nama dan nomor telepon (WhatsApp), untuk memfasilitasi komunikasi dan memberikan layanan pelanggan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Penggunaan Data</h2>
            <p className="mb-2">Data Anda digunakan secara internal oleh tim layanan pelanggan kami untuk:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Menjawab pertanyaan dan melayani kebutuhan Anda.</li>
              <li>Meningkatkan kualitas layanan kami.</li>
              <li>Mengoptimalkan efektivitas kampanye pemasaran kami melalui integrasi pihak ketiga (Meta Platforms, Inc.) secara aman.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Berbagi Data</h2>
            <p>
              Kami tidak menjual data Anda kepada pihak ketiga. Kami mungkin membagikan data interaksi anonim atau terenkripsi (seperti nomor telepon yang di-hash) dengan platform periklanan (Meta) semata-mata untuk mengukur kinerja iklan dan mencocokkan konversi layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3 text-gray-900">Hak Penghapusan Data</h2>
            <p>
              Anda berhak meminta agar informasi kontak Anda dihapus dari sistem CRM internal kami. Untuk meminta penghapusan data, silakan hubungi kami langsung melalui nomor WhatsApp resmi tempat Anda berkomunikasi dengan kami.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
