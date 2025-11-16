import { Navigation } from "@/components/Navigation";
import { PropertyForm, type PropertyDetails } from "@/components/PropertyForm";
import { ValuationResults } from "@/components/ValuationResults";
import { Footer } from "@/components/Footer";
import { useState } from "react";

const ValuationPage = () => {
  const [valuationInput, setValuationInput] = useState<PropertyDetails | undefined>(undefined);
  const handleFormSubmit = (data: PropertyDetails) => {
    setValuationInput(data);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="pt-16">
        <section id="valuation">
          <PropertyForm onSubmit={handleFormSubmit} />
          {valuationInput && <ValuationResults input={valuationInput} stickyHeader={false} />}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ValuationPage;


