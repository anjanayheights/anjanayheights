import LeadDashboard from './components/LeadDashboard';
import AdminDashboardShell from './components/AdminDashboardShell';
import PropertyInventory from './components/PropertyInventory';
import PropertyRecovery from './components/PropertyRecovery';
import LeadMatches from './components/LeadMatches';
import AdminTools from './components/AdminTools';
import FollowupCenter from './components/FollowupCenter';
import SalesPipeline from './components/SalesPipeline';
import DealDesk from './components/DealDesk';
import RevenueDashboard from './components/RevenueDashboard';
import CommissionDashboard from './components/CommissionDashboard';
import BuyerRequirements from './components/BuyerRequirements';
import AiLeadAssistant from './components/AiLeadAssistant';
import LeadGenerationCenter from './components/LeadGenerationCenter';
import LeadSourceAnalytics from './components/LeadSourceAnalytics';
import CampaignPerformance from './components/CampaignPerformance';
import SourceConversionFunnel from './components/SourceConversionFunnel';
import TelecallingCRM from './components/TelecallingCRM';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TrustBar from './components/TrustBar';
import About from './components/About';
import Services from './components/Services';
import FeaturedProperties from './components/FeaturedProperties';
import ImageGallery from './components/ImageGallery';
import Locations from './components/Locations';
import WhyChooseUs from './components/WhyChooseUs';
import HomeLoanSupport from './components/HomeLoanSupport';
import Testimonials from './components/Testimonials';
import FAQ from './components/FAQ';
import Contact from './components/Contact';
import Footer from './components/Footer';
import WhatsAppButton from './components/WhatsAppButton';

export default function App() {
  if (window.location.pathname === '/admin') return <AdminDashboardShell />;
  if (window.location.pathname === '/admin/telecalling') return <TelecallingCRM />;
  if (window.location.pathname === '/admin/properties') return <PropertyInventory />;
  if (window.location.pathname === '/admin/recovery') return <PropertyRecovery />;
  if (window.location.pathname === '/admin/matches') return <LeadMatches />;
  if (window.location.pathname === '/admin/tools') return <AdminTools />;
  if (window.location.pathname === '/admin/followups') return <FollowupCenter />;
  if (window.location.pathname === '/admin/pipeline') return <SalesPipeline />;
  if (window.location.pathname === '/admin/deals') return <DealDesk />;
  if (window.location.pathname === '/admin/revenue') return <RevenueDashboard />;
  if (window.location.pathname === '/admin/commission') return <CommissionDashboard />;
  if (window.location.pathname === '/admin/requirements') return <BuyerRequirements />;
  if (window.location.pathname === '/admin/ai') return <AiLeadAssistant />;
  if (window.location.pathname === '/admin/leads-growth') return <LeadGenerationCenter />;
  if (window.location.pathname === '/admin/source-analytics') return <LeadSourceAnalytics />;
  if (window.location.pathname === '/admin/campaign-performance') return <CampaignPerformance />;
  if (window.location.pathname === '/admin/source-funnel') return <SourceConversionFunnel />;

  return (
    <div className="min-h-screen bg-[#F9F9F7] font-sans text-[#1A1A1A] selection:bg-[#F1EDE4] selection:text-[#1A365D]">
      <Navbar />
      <main><Hero /><TrustBar /><About /><Services /><FeaturedProperties /><ImageGallery /><Locations /><WhyChooseUs /><HomeLoanSupport /><Testimonials /><FAQ /><Contact /></main>
      <Footer /><WhatsAppButton />
    </div>
  );
}
