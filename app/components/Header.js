const Header = () => {
  return (
    <header className="bg-primary text-white p-4 flex justify-between items-center sticky top-0 z-50">
      <div className="text-2xl font-bold">NFT Marketplace</div>
      <nav className="flex gap-4">
        <a href="/" className="hover:text-accent">Home</a>
        <a href="/market" className="hover:text-accent">Market</a>
        <a href="/auctions" className="hover:text-accent">Auctions</a>
        <a href="/profile" className="hover:text-accent">Profile</a>
      </nav>
    </header>
  );
};

export default Header;
