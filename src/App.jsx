import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";

import Home from "./pages/Home";
import About from "./pages/About";
import Training from "./pages/Training";
import Portfolio from "./pages/Portfolio";
import Resources from "./pages/Resources";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import CfdCalculator from "./pages/CfdCalculator";
import CfdTools from "./pages/CfdTools";
import EngineeringReportGenerator from "./pages/EngineeringReportGenerator";
import YPlusCalculator from "./pages/YPlusCalculator";
import YPlusEngineeringReport from "./pages/YPlusEngineeringReport";
import NusseltCalculator from "./pages/NusseltCalculator";
import NusseltEngineeringReport from "./pages/NusseltEngineeringReport";
import PrandtlCalculator from "./pages/PrandtlCalculator";
import PrandtlEngineeringReport from "./pages/PrandtlEngineeringReport";
import FrictionFactorCalculator from "./pages/FrictionFactorCalculator";
import FrictionFactorEngineeringReport from "./pages/FrictionFactorEngineeringReport";
import ReynoldsCalculator from "./pages/ReynoldsCalculator";
import ReynoldsEngineeringReport from "./pages/ReynoldsEngineeringReport";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/training" element={<Training />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/cfd-tools" element={<CfdTools />} />
        <Route path="/cfd-calculator" element={<CfdCalculator />} />
        <Route path="/engineering-report" element={<EngineeringReportGenerator />} />
        <Route path="/yplus-calculator" element={<YPlusCalculator />} />
        <Route path="/yplus-engineering-report" element={<YPlusEngineeringReport />} />
        <Route path="/nusselt-calculator" element={<NusseltCalculator />} />
        <Route path="/nusselt-engineering-report" element={<NusseltEngineeringReport />} />
        <Route path="/prandtl-calculator" element={<PrandtlCalculator />} />
        <Route path="/prandtl-engineering-report" element={<PrandtlEngineeringReport />} />
        <Route path="/friction-factor-calculator" element={<FrictionFactorCalculator />} />
        <Route path="/friction-factor-engineering-report" element={<FrictionFactorEngineeringReport />} />
        <Route path="/reynolds-calculator" element={<ReynoldsCalculator />} />
        <Route path="/reynolds-engineering-report" element={<ReynoldsEngineeringReport />} />
        <Route path="*" element={<NotFound />} />

      </Routes>
      <Analytics />
    </BrowserRouter>
  );
}

export default App;
