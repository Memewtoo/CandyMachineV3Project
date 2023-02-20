import * as mpl from "@metaplex-foundation/mpl-token-metadata";
import * as web3 from "@solana/web3.js";
import * as anchor from '@project-serum/anchor';

/** Reads json file and generate/retrieve a keypair from it */
export function loadWalletKey(keypairFile:string): web3.Keypair {
    const fs = require("fs");
    let seed = Uint8Array.from(fs.readFileSync(keypairFile).toString().replace('[', '').replace(']', '').split(','));
    const keyPair = web3.Keypair.fromSecretKey(seed);
    console.log(keyPair.publicKey.toBase58());
    return keyPair;
}

const METADATA_EXISTING = false;

async function main(){
    const myKeypair = loadWalletKey('id.json');
    
    //Assign the Token Mint Address
    const mint = new web3.PublicKey("CrnD7BiD1GqoVMSvdVKWVfpjdxBBoqnm6v2s3hweqVnr");

    const seed1 = Buffer.from(anchor.utils.bytes.utf8.encode("metadata"));
    const seed2 = Buffer.from(mpl.PROGRAM_ID.toBytes());
    const seed3 = Buffer.from(mint.toBytes());
    const [metadataPDA, _bump] = web3.PublicKey.findProgramAddressSync([seed1, seed2, seed3], mpl.PROGRAM_ID);
    
    const accounts = {
        metadata: metadataPDA,
        mint,
        mintAuthority: myKeypair.publicKey,
        payer: myKeypair.publicKey,
        updateAuthority: myKeypair.publicKey,
    }
    
    const tokenData = {
        name: "CUTE TOKEN",
        symbol: "CUTE",
        uri: "https://storage.googleapis.com/image-storing-bucket/all_images/Token/cute.json",
        sellerFeeBasisPoints: 0,
        creators: null,
        collection: null,
        uses: null
    }
    
    /** Create instructions */

    let ins;

    if (!METADATA_EXISTING) {
        const args =  {
                createMetadataAccountArgsV2: {
                data: tokenData,
                isMutable: true
            }
        };
        ins = mpl.createCreateMetadataAccountV2Instruction(accounts, args);
    } else {
        const args =  {
                updateMetadataAccountArgsV2: {
                data: tokenData,
                isMutable: true,
                updateAuthority: myKeypair.publicKey,
                primarySaleHappened: true
            }
        };
        ins = mpl.createUpdateMetadataAccountV2Instruction(accounts, args)
    }

    const tx = new web3.Transaction();
    tx.add(ins);
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'), 'confirmed');
    const txid = await web3.sendAndConfirmTransaction(connection, tx, [myKeypair]);
    console.log(txid);

}

main();