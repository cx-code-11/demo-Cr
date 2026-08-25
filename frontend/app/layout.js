import './globals.css';
import { AuthProvider } from './AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export const metadata = {
  title: 'Trust Aid - Secure Charity Donation Platform',
  description: 'Browse active charity campaigns, donate securely, and support local NGOs.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <AuthProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
            <Navbar />
            <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              {children}
            </main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
