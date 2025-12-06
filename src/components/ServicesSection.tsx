import { Monitor, Wrench, Building2, Settings } from "lucide-react";
import { Button } from "./ui/button";

const services = [
  {
    icon: Monitor,
    title: "Kompletta Datorer",
    description: "Färdigbyggda system för alla behov",
    cta: "Se utbud",
    href: "#datorer",
    color: "from-cyan-500 to-cyan-600",
  },
  {
    icon: Settings,
    title: "Bygg Själv",
    description: "Välj komponenter och bygg din drömdator",
    cta: "Börja bygga",
    href: "#bygg",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Wrench,
    title: "Reparation & Service",
    description: "Få professionell hjälp med din utrustning",
    cta: "Boka tid",
    href: "#reparation",
    color: "from-purple-500 to-purple-600",
  },
  {
    icon: Building2,
    title: "Företagslösningar",
    description: "IT-infrastruktur och support för företag",
    cta: "Läs mer",
    href: "#foretag",
    color: "from-emerald-500 to-emerald-600",
  },
];

export const ServicesSection = () => {
  return (
    <section id="tjanster" className="py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Våra <span className="text-gradient">Tjänster</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Allt du behöver för en komplett setup, från hårdvara till expertservice
          </p>
        </div>

        {/* Services grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <a
              key={service.title}
              href={service.href}
              className="group glass-card p-6 hover:border-primary/30 transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_0_40px_hsl(var(--primary)/0.1)] animate-fade-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                <service.icon className="w-7 h-7 text-white" />
              </div>

              {/* Content */}
              <h3 className="font-display font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
                {service.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {service.description}
              </p>

              {/* CTA */}
              <span className="inline-flex items-center text-sm font-medium text-primary group-hover:gap-2 transition-all">
                {service.cta}
                <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};
