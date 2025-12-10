import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { COMPUTERS } from "@/data/computers";

export default function Products() {
  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [selectedGPUs, setSelectedGPUs] = useState<string[]>([]);
  const [selectedCPUs, setSelectedCPUs] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);

  const gpus = Array.from(new Set(COMPUTERS.map((c) => c.gpu)));
  const cpus = Array.from(new Set(COMPUTERS.map((c) => c.cpu)));
  const tiers = Array.from(new Set(COMPUTERS.map((c) => c.tier)));

  const filteredProducts = useMemo(() => {
    return COMPUTERS.filter((computer) => {
      const withinPrice = computer.price >= priceRange[0] && computer.price <= priceRange[1];
      const gpuMatch = selectedGPUs.length === 0 || selectedGPUs.includes(computer.gpu);
      const cpuMatch = selectedCPUs.length === 0 || selectedCPUs.includes(computer.cpu);
      const tierMatch = selectedTiers.length === 0 || selectedTiers.includes(computer.tier);

      return withinPrice && gpuMatch && cpuMatch && tierMatch;
    });
  }, [priceRange, selectedGPUs, selectedCPUs, selectedTiers]);

  const toggleFilter = (value: string, selected: string[], setSelected: (v: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter((v) => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 dark:bg-gray-950 dark:text-gray-50 flex flex-col">
      <Navbar />
      <div className="flex flex-1 pt-20">
        {/* Sidebar */}
        <div className="w-full max-w-xs bg-gray-50 dark:bg-gray-900/80 border-r border-gray-200 dark:border-gray-800 p-6 space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Filter</h2>

            {/* Price Range */}
            <div className="mb-8">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Pris</h3>
              <div className="space-y-2">
                <input
                  type="range"
                  min="0"
                  max="30000"
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                  className="w-full accent-yellow-400"
                />
                <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                  <span>{priceRange[0].toLocaleString("sv-SE")} kr</span>
                  <span>{priceRange[1].toLocaleString("sv-SE")} kr</span>
                </div>
              </div>
            </div>

            <hr className="my-6 border-gray-200 dark:border-gray-800" />

            {/* GPU Filter */}
            <div className="mb-8 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Grafikkort</h3>
              {gpus.map((gpu) => (
                <label key={gpu} className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedGPUs.includes(gpu)}
                    onChange={() => toggleFilter(gpu, selectedGPUs, setSelectedGPUs)}
                    className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                  />
                  <span>{gpu}</span>
                </label>
              ))}
            </div>

            <hr className="my-6 border-gray-200 dark:border-gray-800" />

            {/* CPU Filter */}
            <div className="mb-8 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Processor</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto pr-2">
                {cpus.map((cpu) => (
                  <label key={cpu} className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={selectedCPUs.includes(cpu)}
                      onChange={() => toggleFilter(cpu, selectedCPUs, setSelectedCPUs)}
                      className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                    />
                    <span>{cpu}</span>
                  </label>
                ))}
              </div>
            </div>

            <hr className="my-6 border-gray-200 dark:border-gray-800" />

            {/* Tier Filter */}
            <div className="mb-8 space-y-3">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100">Kategori</h3>
              {tiers.map((tier) => (
                <label key={tier} className="flex items-center cursor-pointer gap-3 text-sm text-gray-700 dark:text-gray-200">
                  <input
                    type="checkbox"
                    checked={selectedTiers.includes(tier)}
                    onChange={() => toggleFilter(tier, selectedTiers, setSelectedTiers)}
                    className="w-4 h-4 text-yellow-400 rounded border-gray-300 dark:border-gray-700"
                  />
                  <span className="capitalize">{tier}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => {
                setPriceRange([0, 30000]);
                setSelectedGPUs([]);
                setSelectedCPUs([]);
                setSelectedTiers([]);
              }}
              className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded font-medium transition-colors dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100"
            >
              Rensa filter
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 lg:p-10 bg-white dark:bg-gray-950">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Stationara Datorer</h1>
            <p className="text-gray-600 dark:text-gray-300">
              Visar {filteredProducts.length} av {COMPUTERS.length} produkter
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-96 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-800">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">Inga datorer hittades</p>
                <p className="text-gray-600 dark:text-gray-300">Prova att justera dina filter</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map((computer) => (
                <Link key={computer.id} to={`/computer/${computer.id}`} className="group">
                  <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 dark:hover:border-gray-600 transition-all">
                    {/* Product image area */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 h-48 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 dark:group-hover:from-gray-700 dark:group-hover:to-gray-800 transition-colors">
                      <img src={computer.image} alt={computer.name} className="w-full h-full object-cover" />
                    </div>

                    {/* Product info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">
                        {computer.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <div className="flex text-yellow-400 text-lg" aria-hidden>★★★★★</div>
                        <span className="ml-2 text-xs text-gray-600 dark:text-gray-300">({computer.reviews})</span>
                      </div>

                      {/* Specs */}
                      <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 mb-4 border-t border-gray-100 dark:border-gray-800 pt-3">
                        <p className="truncate">CPU: {computer.cpu}</p>
                        <p className="truncate">GPU: {computer.gpu}</p>
                        <p className="truncate">RAM: {computer.ram}</p>
                        <p className="truncate">
                          Lagring: {computer.storage} {computer.storagetype}
                        </p>
                      </div>

                      {/* Price */}
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {computer.price.toLocaleString("sv-SE")} kr
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
