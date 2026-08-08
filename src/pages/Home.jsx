import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import Services from "../components/Services/Services";
import Software from "../components/Software/Software";
import Industries from "../components/Industries/Industries";
import WhyChooseUs from "../components/WhyChooseUs/WhyChooseUs";
import ContactCTA from "../components/ContactCTA/ContactCTA";
import Footer from "../components/Footer/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <Services />
      <Software />
      <Industries />
      <WhyChooseUs />
      <ContactCTA />
      <Footer />
    </>
  );
}