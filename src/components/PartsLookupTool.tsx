import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package, DollarSign, MapPin, CheckCircle, XCircle } from "lucide-react";

interface PartResult {
  store: string;
  price: number;
  available: boolean;
  distance: number;
  quoteNumber: string;
  eta: string;
}

// This simulates calling an external API or a Twilio function
const fetchPartQuotes = async (vin: string, description: string): Promise<PartResult[]> => {
  console.log(`Searching for: ${description} (VIN: ${vin})`);
  await new Promise(res => setTimeout(res, 1500)); // Simulate network delay
  
  // Mocked results
  return [
    { store: "FleetPride", price: 245.50, available: true, distance: 8.2, quoteNumber: "FP-12345", eta: "In stock" },
    { store: "NAPA Truck Service", price: 260.00, available: true, distance: 15.5, quoteNumber: "NTS-67890", eta: "In stock" },
    { store: "Vander Haag's", price: 230.00, available: false, distance: 22.1, quoteNumber: "VH-54321", eta: "2-3 days" },
  ].sort((a, b) => a.price - b.price);
};

export const PartsLookupTool = () => {
  const [vin, setVin] = useState("");
  const [description, setDescription] = useState("");
  const [results, setResults] = useState<PartResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!vin && !description) return;
    setIsLoading(true);
    const quotes = await fetchPartQuotes(vin, description);
    setResults(quotes.filter(q => q.distance < 25).slice(0, 2));
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-6 w-6" /> AI Parts Lookup & Quoting
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label htmlFor="vin">Truck VIN</Label>
            <Input id="vin" value={vin} onChange={e => setVin(e.target.value)} placeholder="Enter VIN..." />
          </div>
          <div>
            <Label htmlFor="description">Part Name or Number</Label>
            <Input id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g., Alternator for Cummins X15" />
          </div>
          <div className="self-end">
            <Button onClick={handleSearch} disabled={isLoading} className="w-full">
              {isLoading ? "Searching..." : "Find Parts"}
            </Button>
          </div>
        </div>

        {results.length > 0 && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold">Top 2 Options (Price & Distance)</h3>
            {results.map((result, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-lg">{result.store}</h4>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <MapPin className="h-4 w-4" /> {result.distance} miles away
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Quote #: {result.quoteNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">${result.price.toFixed(2)}</div>
                    <div className={`flex items-center justify-end gap-1 text-sm ${result.available ? 'text-green-700' : 'text-orange-600'}`}>
                      {result.available ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                      {result.eta}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};