import { Button } from "./ui/button";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  name: string;
  tier: "platinum" | "gold" | "silver";
  price: number;
  salePrice?: number;
  image: string;
  delay?: number;
}

const tierLabels = {
  platinum: "Platina",
  gold: "Guld",
  silver: "Silver",
};

const tierStyles = {
  platinum: "tier-platinum",
  gold: "tier-gold",
  silver: "tier-silver",
};

export const ProductCard = ({ name, tier, price, salePrice, image, delay = 0 }: ProductCardProps) => {
  const isOnSale = salePrice !== undefined;

  return (
    <div 
      className="group glass-card overflow-hidden hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_0_40px_hsl(var(--primary)/0.15)] animate-fade-in"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Image container */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          loading="lazy"
          decoding="async"
        />
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {isOnSale && (
            <span className="px-2 py-1 text-xs font-bold rounded-md bg-sale text-white">
              REA
            </span>
          )}
          <span className={`px-2 py-1 text-xs font-bold rounded-md ${tierStyles[tier]}`}>
            {tierLabels[tier]}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="font-display font-semibold text-lg text-foreground mb-3 group-hover:text-primary transition-colors">
          {name}
        </h3>

        <div className="flex items-end justify-between">
          <div>
            {isOnSale ? (
              <>
                <span className="text-sm text-muted-foreground line-through mr-2">
                  {price.toLocaleString("sv-SE")} kr
                </span>
                <span className="font-display font-bold text-xl text-sale">
                  {salePrice.toLocaleString("sv-SE")} kr
                </span>
              </>
            ) : (
              <span className="font-display font-bold text-xl text-foreground">
                {price.toLocaleString("sv-SE")} kr
              </span>
            )}
          </div>

          <Button variant="glow" size="sm" className="group/btn">
            <ShoppingCart className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
            Köp
          </Button>
        </div>
      </div>
    </div>
  );
};
