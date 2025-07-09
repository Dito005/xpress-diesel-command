
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, TrendingUp, DollarSign, Calculator, Lightbulb, CheckCircle, AlertTriangle } from "lucide-react";

export const PricingAI = () => {
  const [jobType, setJobType] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [complexity, setComplexity] = useState("");
  const [urgency, setUrgency] = useState("");
  const [customerType, setCustomerType] = useState("");
  const [pricingResult, setPricingResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleCalculatePricing = () => {
    setIsLoading(true);
    
    // Simulate AI calculation
    setTimeout(() => {
      const basePrice = getBasePrice(jobType);
      const multipliers = {
        vehicle: getVehicleMultiplier(vehicleType),
        complexity: getComplexityMultiplier(complexity),
        urgency: getUrgencyMultiplier(urgency),
        customer: getCustomerMultiplier(customerType)
      };
      
      const calculatedPrice = basePrice * multipliers.vehicle * multipliers.complexity * multipliers.urgency * multipliers.customer;
      const marketRate = calculatedPrice * (0.9 + Math.random() * 0.2); // Simulate market variance
      
      setPricingResult({
        recommendedPrice: Math.round(calculatedPrice),
        marketAverage: Math.round(marketRate),
        confidence: Math.round(85 + Math.random() * 10),
        factors: [
          { name: "Job Complexity", impact: complexity === "high" ? "+25%" : complexity === "medium" ? "+10%" : "Base" },
          { name: "Vehicle Type", impact: vehicleType === "heavy" ? "+30%" : vehicleType === "medium" ? "+15%" : "Base" },
          { name: "Urgency", impact: urgency === "emergency" ? "+50%" : urgency === "priority" ? "+20%" : "Base" },
          { name: "Customer Tier", impact: customerType === "premium" ? "-5%" : customerType === "regular" ? "Base" : "+10%" }
        ],
        recommendations: [
          "Price is 8% above market average - consider customer relationship",
          "Similar jobs completed at 92% success rate",
          "Optimal pricing window: $" + (calculatedPrice - 200) + " - $" + (calculatedPrice + 300)
        ]
      });
      setIsLoading(false);
    }, 2000);
  };

  const getBasePrice = (type) => {
    const prices = {
      "pm-service": 450,
      "brake-repair": 800,
      "engine-work": 1200,
      "ac-repair": 600,
      "transmission": 1500,
      "electrical": 500
    };
    return prices[type] || 500;
  };

  const getVehicleMultiplier = (type) => {
    return { "light": 1, "medium": 1.15, "heavy": 1.3 }[type] || 1;
  };

  const getComplexityMultiplier = (level) => {
    return { "low": 1, "medium": 1.1, "high": 1.25 }[level] || 1;
  };

  const getUrgencyMultiplier = (level) => {
    return { "standard": 1, "priority": 1.2, "emergency": 1.5 }[level] || 1;
  };

  const getCustomerMultiplier = (type) => {
    return { "new": 1.1, "regular": 1, "premium": 0.95 }[type] || 1;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Calculator className="h-6 w-6 text-blue-600" />
          AI Pricing Assistant
        </h2>
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <Bot className="h-3 w-3 mr-1" />
          Powered by AI
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Job Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobType">Job Type</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pm-service">PM Service</SelectItem>
                  <SelectItem value="brake-repair">Brake Repair</SelectItem>
                  <SelectItem value="engine-work">Engine Work</SelectItem>
                  <SelectItem value="ac-repair">AC Repair</SelectItem>
                  <SelectItem value="transmission">Transmission</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="vehicleType">Vehicle Type</Label>
              <Select value={vehicleType} onValueChange={setVehicleType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light Duty</SelectItem>
                  <SelectItem value="medium">Medium Duty</SelectItem>
                  <SelectItem value="heavy">Heavy Duty</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="complexity">Job Complexity</Label>
              <Select value={complexity} onValueChange={setComplexity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select complexity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="urgency">Urgency Level</Label>
              <Select value={urgency} onValueChange={setUrgency}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="priority">Priority</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customerType">Customer Type</Label>
              <Select value={customerType} onValueChange={setCustomerType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New Customer</SelectItem>
                  <SelectItem value="regular">Regular Customer</SelectItem>
                  <SelectItem value="premium">Premium Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleCalculatePricing} 
              disabled={!jobType || !vehicleType || !complexity || !urgency || !customerType || isLoading}
              className="w-full"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Calculating...
                </div>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculate AI Pricing
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-500" />
              Pricing Recommendation
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pricingResult ? (
              <div className="space-y-6">
                {/* Main Price */}
                <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-2">Recommended Price</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    ${pricingResult.recommendedPrice.toLocaleString()}
                  </div>
                  <div className="flex items-center justify-center gap-4 text-sm text-gray-600">
                    <span>Market Avg: ${pricingResult.marketAverage.toLocaleString()}</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700">
                      {pricingResult.confidence}% Confidence
                    </Badge>
                  </div>
                </div>

                {/* Pricing Factors */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Pricing Factors</h4>
                  <div className="space-y-2">
                    {pricingResult.factors.map((factor, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{factor.name}</span>
                        <Badge variant="outline" className={
                          factor.impact.includes('+') ? 'text-red-600' : 
                          factor.impact.includes('-') ? 'text-green-600' : 'text-gray-600'
                        }>
                          {factor.impact}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">AI Recommendations</h4>
                  <div className="space-y-2">
                    {pricingResult.recommendations.map((rec, index) => (
                      <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                        <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-blue-800">{rec}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Calculator className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Calculate</h3>
                <p className="text-gray-600">Fill in the job details to get AI-powered pricing recommendations</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
