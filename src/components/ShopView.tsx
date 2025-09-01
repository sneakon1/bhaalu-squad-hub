import { useState } from 'react';
import ProductCard from './ProductCard';
import blueJersey from '@/assets/bhaaluSquadBlue.jpg';
import redJersey from '@/assets/bhaaluSquadRed.jpg';
import ProductDetails from './ProductDetails';

const products = [
  {
    id: '1',
    name: 'Bhaalu Squad Blue Jersey',
    price: 899,
    image: blueJersey, // ✅ use imported image
    description: 'Official Bhaalu Squad blue jersey. Made with premium moisture-wicking fabric.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: 'Blue'
  },
  {
    id: '2',
    name: 'Bhaalu Squad Red Jersey',
    price: 899,
    image: redJersey, // ✅ use imported image
    description: 'Official Bhaalu Squad red jersey. Made with premium moisture-wicking fabric.',
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    color: 'Red'
  }
];

const ShopView = () => {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Team Shop</h1>
        <p className="text-muted-foreground">Get your official Bhaalu Squad merchandise</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onViewDetails={() => setSelectedProduct(product)}
          />
        ))}
      </div>

      {selectedProduct && (
        <ProductDetails
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default ShopView;