import { ProductCard } from "./ProductCard";

const products = [
  {
    name: "Platina Frostbyte",
    tier: "platinum" as const,
    price: 28990,
  },
  {
    name: "Platina Titan X",
    tier: "platinum" as const,
    price: 45990,
  },
  {
    name: "Guld Spectra Pro",
    tier: "gold" as const,
    price: 22990,
    salePrice: 20691,
  },
  {
    name: "Guld Inferno",
    tier: "gold" as const,
    price: 19990,
  },
  {
    name: "Silver Nova GT",
    tier: "silver" as const,
    price: 15490,
    salePrice: 14716,
  },
  {
    name: "Silver Shadow",
    tier: "silver" as const,
    price: 8499,
  },
];

export const ProductsSection = () => {
  return (
    <section id="produkter" className="py-20 lg:py-32 bg-background">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Populära <span className="text-gradient">Produkter</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Utforska vårt sortiment av högpresterande gaming-datorer i olika prisklasser
          </p>
        </div>

        {/* Products grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {products.map((product, index) => (
            <ProductCard
              key={product.name}
              {...product}
              delay={index * 100}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
