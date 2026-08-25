import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Trust Aid - Secure Charity Donation Platform',
  description: 'Browse active charity campaigns, donate securely, and support local NGOs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
          <Navbar />
          <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
