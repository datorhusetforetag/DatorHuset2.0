import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { COMPUTERS } from "@/data/computers";

type TierKey = "platinum" | "gold" | "silver" | "bronze" | "diamond" | "paket";

interface Computer {
  id: string;
  name: string;
  price: number;
  cpu: string;
  gpu: string;
  ram: string;
  tier: TierKey;
  discount?: number;
}

const normalizeTier = (tier: string): TierKey => {
  const normalized = tier.toLowerCase();
  if (
    normalized === "platinum" ||
    normalized === "gold" ||
    normalized === "silver" ||
    normalized === "bronze" ||
    normalized === "diamond" ||
    normalized === "paket"
  ) {
    return normalized;
  }
  return "silver";
};

const computers: Computer[] = COMPUTERS.map((computer) => ({
  id: computer.id,
  name: computer.name,
  price: computer.price,
  cpu: computer.cpu,
  gpu: computer.gpu,
  ram: computer.ram,
  tier: normalizeTier(computer.tier),
}));

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
      else if (computer.cpu.toLowerCase().includes(query)) {
        foundResults.push({
          ...computer,
          matchType: "cpu",
          matchText: computer.cpu,
        });
      }
      // Search by GPU
      else if (computer.gpu.toLowerCase().includes(query)) {
        foundResults.push({
          ...computer,
          matchType: "gpu",
          matchText: computer.gpu,
        });
      }
    });

    return foundResults;
  }, [searchQuery]);

  const tierColors: Record<TierKey, string> = {
    platinum: "from-yellow-500/20 to-yellow-600/20",
    gold: "from-amber-500/20 to-amber-600/20",
    silver: "from-gray-500/20 to-gray-600/20",
    bronze: "from-orange-500/20 to-orange-600/20",
    diamond: "from-cyan-500/20 to-cyan-600/20",
    paket: "from-emerald-500/20 to-emerald-600/20",
  };

  const tierBadgeStyles: Record<TierKey, string> = {
    platinum: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-200",
    gold: "bg-amber-500/20 text-amber-700 dark:text-amber-200",
    silver: "bg-gray-500/20 text-gray-700 dark:text-gray-200",
    bronze: "bg-orange-500/20 text-orange-700 dark:text-orange-200",
    diamond: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-200",
    paket: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-200",
  };

  const tierLabels: Record<TierKey, string> = {
    platinum: "Platina",
    gold: "Guld",
    silver: "Silver",
    bronze: "Bronze",
    diamond: "Diamond",
    paket: "Paket",
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
                              className={`text-xs font-semibold px-2 py-1 rounded-full ${tierBadgeStyles[computer.tier]}`}
                            >
                              {tierLabels[computer.tier]}
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
                              {computer.cpu}
                            </p>
                            <p>
                              <span className="font-semibold text-foreground">GPU:</span>{" "}
                              {computer.gpu}
                            </p>
                            <p>
                              <span className="font-semibold text-foreground">RAM:</span>{" "}
                              {computer.ram}
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
