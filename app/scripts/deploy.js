async function main() {
    const ArtNFT = await ethers.getContractFactory("ArtNFT");
    const artNFT = await ArtNFT.deploy();
    await artNFT.deployed();
    console.log("ArtNFT deployed to:", artNFT.address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
