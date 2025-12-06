import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface Computer {
  id: number;
  name: string;
  price: number;
  specs: {
    cpu: string;
    gpu: string;
    ram: number;
    storage: number;
    storageType: "SSD" | "HDD" | "NVMe";
  };
  tier: "platinum" | "gold" | "silver";
  discount?: number;
}

const computers: Computer[] = [
  {
    id: 1,
    name: "Platina Frostbyte",
    price: 28990,
    tier: "platinum",
    specs: {
      cpu: "Intel Core i9-13900K",
      gpu: "NVIDIA RTX 4080",
      ram: 32,
      storage: 1000,
      storageType: "NVMe",
    },
  },
  {
    id: 2,
    name: "Platina Titan X",
    price: 45990,
    tier: "platinum",
    specs: {
      cpu: "Intel Core i9-14900KS",
      gpu: "NVIDIA RTX 4090",
      ram: 64,
      storage: 2000,
      storageType: "NVMe",
    },
  },
  {
    id: 3,
    name: "Guld Spectra Pro",
    price: 22990,
    tier: "gold",
    discount: 10,
    specs: {
      cpu: "Intel Core i7-13700K",
      gpu: "NVIDIA RTX 4070 Ti",
      ram: 32,
      storage: 1000,
      storageType: "NVMe",
    },
  },
  {
    id: 4,
    name: "Guld Inferno",
    price: 19990,
    tier: "gold",
    specs: {
      cpu: "Intel Core i7-13700",
      gpu: "NVIDIA RTX 4070",
      ram: 16,
      storage: 512,
      storageType: "NVMe",
    },
  },
  {
    id: 5,
    name: "Silver Nova GT",
    price: 15490,
    tier: "silver",
    discount: 5,
    specs: {
      cpu: "Intel Core i5-13600K",
      gpu: "NVIDIA RTX 4060 Ti",
      ram: 16,
      storage: 512,
      storageType: "SSD",
    },
  },
  {
    id: 6,
    name: "Silver Shadow",
    price: 8499,
    tier: "silver",
    specs: {
      cpu: "Intel Core i5-13600",
      gpu: "NVIDIA RTX 4060",
      ram: 8,
      storage: 256,
      storageType: "SSD",
    },
  },
  {
    id: 7,
    name: "Elite Quantum Pro",
    price: 35990,
    tier: "platinum",
    specs: {
      cpu: "AMD Ryzen 9 7950X",
      gpu: "NVIDIA RTX 4080 Super",
      ram: 48,
      storage: 1500,
      storageType: "NVMe",
    },
  },
  {
    id: 8,
    name: "Advanced Velocity",
    price: 24990,
    tier: "gold",
    specs: {
      cpu: "AMD Ryzen 7 7700X",
      gpu: "NVIDIA RTX 4070 Super",
      ram: 32,
      storage: 1000,
      storageType: "NVMe",
    },
  },
];

interface SearchResult extends Computer {
  matchType: "name" | "cpu" | "gpu";
  matchText: string;
}

export default function SearchResults() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const results = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    const foundResults: SearchResult[] = [];

    computers.forEach((computer) => {
      // Search by name
      if (computer.name.toLowerCase().includes(query)) {
        foundResults.push({
          ...computer,
          matchType: "name",
          matchText: computer.name,
        });
      }
      // Search by CPU
      else if (computer.specs.cpu.toLowerCase().includes(query)) {
        foundResults.push({
          ...computer,
          matchType: "cpu",
          matchText: computer.specs.cpu,
        });
      }
      // Search by GPU
      else if (computer.specs.gpu.toLowerCase().includes(query)) {
        foundResults.push({
          ...computer,
          matchType: "gpu",
          matchText: computer.specs.gpu,
        });
      }
    });

    return foundResults;
  }, [searchQuery]);

  const tierColors = {
    platinum: "from-yellow-500/20 to-yellow-600/20",
    gold: "from-amber-500/20 to-amber-600/20",
    silver: "from-gray-500/20 to-gray-600/20",
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        <div className="container mx-auto px-4 py-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka
          </Button>

          {/* Search Input */}
          <div className="mb-8 max-w-2xl">
            <input
              type="text"
              placeholder="Sök efter datornamn eller komponenter (t.ex. RTX 4080, i9)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-lg"
              autoFocus
            />
          </div>

          <Separator className="mb-8" />

          {/* Results */}
          {searchQuery.trim() === "" ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Börja skriva för att söka efter datorer och komponenter
              </p>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                Inga resultaten hittades för "{searchQuery}"
              </p>
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground mb-6">
                {results.length} resultat hittade
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((computer) => {
                  const finalPrice = computer.discount
                    ? computer.price * (1 - computer.discount / 100)
                    : computer.price;

                  return (
                    <Link
                      key={`${computer.id}-${computer.matchType}`}
                      to={`/computer/${computer.id}`}
                      className="no-underline"
                    >
                      <div className="bg-card rounded-lg border border-border overflow-hidden hover:border-primary/50 transition-all hover:shadow-lg cursor-pointer group h-full">
                        {/* Image */}
                        <div className={`w-full h-48 bg-gradient-to-br ${tierColors[computer.tier]} flex items-center justify-center group-hover:from-primary/20 group-hover:to-secondary/20 transition-colors`}>
                          <div className="text-center">
                            <div className="text-4xl mb-2">💻</div>
                            <p className="text-xs text-muted-foreground">Produktbild</p>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="text-lg font-semibold flex-1">
                              {computer.name}
                            </h3>
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                computer.tier === "platinum"
                                  ? "bg-yellow-500/20 text-yellow-700 dark:text-yellow-200"
                                  : computer.tier === "gold"
                                  ? "bg-amber-500/20 text-amber-700 dark:text-amber-200"
                                  : "bg-gray-500/20 text-gray-700 dark:text-gray-200"
                              }`}
                            >
                              {computer.tier === "platinum"
                                ? "Platina"
                                : computer.tier === "gold"
                                ? "Guld"
                                : "Silver"}
                            </span>
                          </div>

                          {/* Match Info */}
                          <div className="bg-primary/10 rounded px-2 py-1 mb-3">
                            <p className="text-xs text-primary font-semibold">
                              {computer.matchType === "name"
                                ? "Matchar namn"
                                : computer.matchType === "cpu"
                                ? "Matchar processor"
                                : "Matchar grafikkort"}
                            </p>
                            <p className="text-xs text-foreground truncate">
                              {computer.matchText}
                            </p>
                          </div>

                          {/* Specs Summary */}
                          <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                            <p>
                              <span className="font-semibold text-foreground">CPU:</span>{" "}
                              {computer.specs.cpu}
                            </p>
                            <p>
                              <span className="font-semibold text-foreground">GPU:</span>{" "}
                              {computer.specs.gpu}
                            </p>
                            <p>
                              <span className="font-semibold text-foreground">RAM:</span>{" "}
                              {computer.specs.ram} GB
                            </p>
                          </div>

                          <Separator className="mb-4" />

                          {/* Price */}
                          <div className="flex items-baseline gap-2">
                            {computer.discount ? (
                              <>
                                <span className="text-xl font-bold text-primary">
                                  {finalPrice.toLocaleString("sv-SE")} kr
                                </span>
                                <span className="text-xs text-muted-foreground line-through">
                                  {computer.price.toLocaleString("sv-SE")} kr
                                </span>
                              </>
                            ) : (
                              <span className="text-xl font-bold text-primary">
                                {computer.price.toLocaleString("sv-SE")} kr
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
