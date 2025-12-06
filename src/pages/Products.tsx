import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';

interface Computer {
  id: string;
  name: string;
  price: number;
  cpu: string;
  gpu: string;
  ram: string;
  storage: string;
  storagetype: string;
  tier: string;
  rating: number;
  reviews: number;
}

const COMPUTERS: Computer[] = [
  {
    id: '1',
    name: 'Bronze Starter',
    price: 4999,
    cpu: 'Intel i5-13600K',
    gpu: 'RTX 3060',
    ram: '16GB DDR5',
    storage: '512GB',
    storagetype: 'SSD',
    tier: 'Bronze',
    rating: 4.2,
    reviews: 145
  },
  {
    id: '2',
    name: 'Silver Ascent',
    price: 8999,
    cpu: 'Intel i7-13700K',
    gpu: 'RTX 4070',
    ram: '32GB DDR5',
    storage: '1TB',
    storagetype: 'SSD',
    tier: 'Silver',
    rating: 4.5,
    reviews: 287
  },
  {
    id: '3',
    name: 'Gold Pinnacle',
    price: 12999,
    cpu: 'Intel i9-13900K',
    gpu: 'RTX 4080',
    ram: '64GB DDR5',
    storage: '2TB',
    storagetype: 'SSD',
    tier: 'Gold',
    rating: 4.8,
    reviews: 512
  },
  {
    id: '4',
    name: 'Platina Frostbyte',
    price: 18999,
    cpu: 'Intel i9-14900KS',
    gpu: 'RTX 4090',
    ram: '128GB DDR5',
    storage: '4TB',
    storagetype: 'SSD',
    tier: 'Platinum',
    rating: 4.9,
    reviews: 834
  },
  {
    id: '5',
    name: 'Diamond Quantum',
    price: 24999,
    cpu: 'Intel Xeon W9-3595X',
    gpu: 'RTX 6000 Ada',
    ram: '256GB DDR5',
    storage: '8TB',
    storagetype: 'SSD',
    tier: 'Diamond',
    rating: 5.0,
    reviews: 92
  },
  {
    id: '6',
    name: 'Bronze Compact',
    price: 3999,
    cpu: 'AMD Ryzen 5 5600X',
    gpu: 'RTX 3050',
    ram: '8GB DDR4',
    storage: '256GB',
    storagetype: 'SSD',
    tier: 'Bronze',
    rating: 4.1,
    reviews: 198
  },
  {
    id: '7',
    name: 'Silver Speedster',
    price: 9999,
    cpu: 'AMD Ryzen 7 7700X',
    gpu: 'RTX 4070 Super',
    ram: '32GB DDR5',
    storage: '1TB',
    storagetype: 'NVMe',
    tier: 'Silver',
    rating: 4.6,
    reviews: 423
  },
  {
    id: '8',
    name: 'Gold Architect',
    price: 14999,
    cpu: 'AMD Ryzen 9 7950X',
    gpu: 'RTX 4090',
    ram: '64GB DDR5',
    storage: '2TB',
    storagetype: 'NVMe',
    tier: 'Gold',
    rating: 4.7,
    reviews: 687
  }
];

export default function Products() {
  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [selectedGPUs, setSelectedGPUs] = useState<string[]>([]);
  const [selectedCPUs, setSelectedCPUs] = useState<string[]>([]);
  const [selectedTiers, setSelectedTiers] = useState<string[]>([]);

  const gpus = Array.from(new Set(COMPUTERS.map(c => c.gpu)));
  const cpus = Array.from(new Set(COMPUTERS.map(c => c.cpu)));
  const tiers = Array.from(new Set(COMPUTERS.map(c => c.tier)));

  const filteredProducts = useMemo(() => {
    return COMPUTERS.filter(computer => {
      const withinPrice = computer.price >= priceRange[0] && computer.price <= priceRange[1];
      const gpuMatch = selectedGPUs.length === 0 || selectedGPUs.includes(computer.gpu);
      const cpuMatch = selectedCPUs.length === 0 || selectedCPUs.includes(computer.cpu);
      const tierMatch = selectedTiers.length === 0 || selectedTiers.includes(computer.tier);

      return withinPrice && gpuMatch && cpuMatch && tierMatch;
    });
  }, [priceRange, selectedGPUs, selectedCPUs, selectedTiers]);

  const toggleFilter = (value: string, selected: string[], setSelected: (v: string[]) => void) => {
    if (selected.includes(value)) {
      setSelected(selected.filter(v => v !== value));
    } else {
      setSelected([...selected, value]);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="flex pt-20">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Filter</h2>

          {/* Price Range */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Pris</h3>
            <div className="space-y-2">
              <input
                type="range"
                min="0"
                max="30000"
                value={priceRange[1]}
                onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{priceRange[0].toLocaleString('sv-SE')} kr</span>
                <span>{priceRange[1].toLocaleString('sv-SE')} kr</span>
              </div>
            </div>
          </div>

          <hr className="my-6" />

          {/* GPU Filter */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Grafikkort</h3>
            <div className="space-y-3">
              {gpus.map(gpu => (
                <label key={gpu} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedGPUs.includes(gpu)}
                    onChange={() => toggleFilter(gpu, selectedGPUs, setSelectedGPUs)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">{gpu}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="my-6" />

          {/* CPU Filter */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Processor</h3>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {cpus.map(cpu => (
                <label key={cpu} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCPUs.includes(cpu)}
                    onChange={() => toggleFilter(cpu, selectedCPUs, setSelectedCPUs)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">{cpu}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="my-6" />

          {/* Tier Filter */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Kategori</h3>
            <div className="space-y-3">
              {tiers.map(tier => (
                <label key={tier} className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTiers.includes(tier)}
                    onChange={() => toggleFilter(tier, selectedTiers, setSelectedTiers)}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300"
                  />
                  <span className="ml-3 text-sm text-gray-700">{tier}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              setPriceRange([0, 30000]);
              setSelectedGPUs([]);
              setSelectedCPUs([]);
              setSelectedTiers([]);
            }}
            className="w-full py-2 px-4 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded font-medium transition-colors"
          >
            Rensa filter
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Stationära Datorer</h1>
            <p className="text-gray-600">
              Visar {filteredProducts.length} av {COMPUTERS.length} produkter
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="flex items-center justify-center h-96 bg-gray-50 rounded border border-gray-200">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">Inga datorer hittades</p>
                <p className="text-gray-600">Prova att justera dina filter</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(computer => (
                <Link
                  key={computer.id}
                  to={`/computer/${computer.id}`}
                  className="group"
                >
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all">
                    {/* Product image area */}
                    <div className="bg-gradient-to-br from-gray-100 to-gray-200 h-48 flex items-center justify-center group-hover:from-gray-200 group-hover:to-gray-300 transition-colors">
                      <div className="text-center">
                        <div className="text-6xl font-bold text-gray-400 mb-2">{computer.tier.charAt(0).toUpperCase()}</div>
                        <p className="text-sm text-gray-500">{computer.tier}</p>
                      </div>
                    </div>

                    {/* Product info */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {computer.name}
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center mb-3">
                        <div className="flex">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span
                              key={i}
                              className={i < Math.floor(computer.rating) ? 'text-yellow-400' : 'text-gray-300'}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                        <span className="ml-2 text-xs text-gray-600">({computer.reviews})</span>
                      </div>

                      {/* Specs */}
                      <div className="text-sm text-gray-600 space-y-1 mb-4 border-t border-gray-100 pt-3">
                        <p className="truncate">🖥️ CPU: {computer.cpu}</p>
                        <p className="truncate">🎮 GPU: {computer.gpu}</p>
                        <p className="truncate">💾 RAM: {computer.ram}</p>
                        <p className="truncate">💿 {computer.storage} {computer.storagetype}</p>
                      </div>

                      {/* Price and button */}
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-gray-900">
                          {computer.price.toLocaleString('sv-SE')} kr
                        </span>
                        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
                          Visa
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
