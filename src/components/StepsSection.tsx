import { Euro, Monitor, Package, RefreshCcw } from "lucide-react";
import { Link } from "react-router-dom";

const steps = [
  {
    title: "1. Gör en preorder",
    description: "Hitta ett brett utbud av datorer eller skicka in ett custom-bygge du vill ha.",
    icon: <Monitor className="w-14 h-14 text-yellow-400 dark:text-yellow-300" />,
  },
  {
    title: "2. Vi bygger och packar din dator",
    description:
      "Vi köper komponenterna och bygger datorn. Byggtiden varierar mellan 3-12 dagar beroende på om det är en färdigbyggd eller custom dator.",
    icon: <Package className="w-14 h-14 text-yellow-400 dark:text-yellow-300" />,
  },
  {
    title: "3. Leverans/hämta upp",
    description: "Datorn är byggd och klar. Hämta upp den eller välj leverans (Postnord/annat).",
    icon: (
      <div className="flex items-center gap-3">
        <RefreshCcw className="w-10 h-10 text-yellow-400 dark:text-yellow-300" />
        <Euro className="w-10 h-10 text-yellow-400 dark:text-yellow-300" />
      </div>
    ),
  },
];

export const StepsSection = () => {
  return (
    <section className="bg-gray-100 text-gray-900 dark:bg-[#0f1216] dark:text-gray-100 transition-colors">
      <div className="container mx-auto px-4 py-16 lg:py-20 flex flex-col items-center text-center">
        <div className="mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold mb-3 text-gray-900 dark:text-gray-100">
            Att köpa en riktigt bra dator har aldrig varit så lätt
          </h2>
          <p className="text-lg text-gray-700 dark:text-gray-300">Så här köper du din dator via vår tjänst</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl">
          {steps.map((step) => (
            <div
              key={step.title}
              className="bg-white border border-gray-200 rounded-xl px-8 py-10 flex flex-col items-center gap-4 shadow-[0_20px_60px_rgba(0,0,0,0.05)] dark:bg-[#0f1419] dark:border-gray-800 dark:shadow-[0_10px_30px_rgba(0,0,0,0.25)]"
            >
              {step.icon}
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{step.title}</h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row gap-3">
          <Link
            to="/products"
            className="px-8 py-3 bg-yellow-400 hover:bg-[#11667b] hover:text-white text-gray-900 font-semibold rounded-lg transition-colors text-center"
          >
            Köp din dator
          </Link>
          <Link
            to="/custom-bygg"
            className="px-8 py-3 bg-transparent border border-yellow-400 text-gray-900 hover:bg-[#11667b] hover:text-white hover:border-[#11667b] font-semibold rounded-lg transition-colors text-center dark:text-gray-100"
          >
            Gör en custom bygg
          </Link>
        </div>
      </div>
    </section>
  );
};
