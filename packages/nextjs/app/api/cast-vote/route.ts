import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { genRandomSalt } from "maci-crypto";
import { Keypair, PCommand, PrivKey, PubKey } from "maci-domainobjs";
import { getContract } from "viem";
import { z } from "zod";
import PollAbi from "~~/abi/Poll";
import { chain, maciWrapperContract, publicClient, serverWalletClient } from "~~/constants";
import deployedContracts from "~~/contracts/deployedContracts";

const prisma = new PrismaClient();

const CastVoteSchema = z.object({
  pollId: z.string(),
  userTelegramId: z.string(),
  vote: z.boolean(),
});

export const POST = async (req: NextRequest) => {
  let body: typeof CastVoteSchema._type;
  try {
    const { success, error, data } = CastVoteSchema.safeParse(await req.json());
    if (!success) {
      return NextResponse.json({ error: "invalid body", issues: error.issues }, { status: 409 });
    }
    body = data;
  } catch (e) {
    return NextResponse.json({ error: "invalid body" }, { status: 409 });
  }

  const { pollId, vote, userTelegramId } = body;

  // check if the user exists in the maci contract
  const user = await prisma.user.findUnique({ where: { id: userTelegramId } });
  let keypair: Keypair;
  if (!user) {
    keypair = new Keypair();
    await prisma.user.create({ data: { id: userTelegramId, secretKey: keypair.privKey.serialize() } });
  } else {
    keypair = new Keypair(PrivKey.deserialize(user.secretKey));
  }

  console.log(keypair);

  let signUpEvents = await maciWrapperContract.getEvents.SignUp(
    { _userPubKeyX: keypair.pubKey.rawPubKey[0], _userPubKeyY: keypair.pubKey.rawPubKey[1] },
    { fromBlock: BigInt(deployedContracts[chain.id].MACIWrapper.deploymentBlockNumber) },
  );
  console.log(signUpEvents);
  if (signUpEvents.length == 0) {
    console.log("signing up");
    await maciWrapperContract.write.signUp([keypair.pubKey.asContractParam() as any, "0x", "0x"]);
    console.log("signed up");
    signUpEvents = await maciWrapperContract.getEvents.SignUp(
      { _userPubKeyX: keypair.pubKey.rawPubKey[0], _userPubKeyY: keypair.pubKey.rawPubKey[1] },
      { fromBlock: BigInt(deployedContracts[chain.id].MACIWrapper.deploymentBlockNumber) },
    );
    console.log(signUpEvents);
  }

  if (signUpEvents.length == 0) {
    return NextResponse.json({ error: "something went wrong" }, { status: 500 });
  }

  const stateIndex = signUpEvents[0].args._stateIndex || 0n;
  console.log(stateIndex);

  const command: PCommand = new PCommand(
    stateIndex, // stateindex
    keypair.pubKey, // userMaciPubKey
    BigInt(vote ? 0 : 1),
    1n,
    1n,
    BigInt(pollId),
    genRandomSalt(),
  );

  const signature = command.sign(keypair.privKey);
  console.log(signature);

  const encKeyPair = new Keypair();

  const coordinatorRawPubKey = await maciWrapperContract.read.coordinatorPubKey();

  const coordinatorPubKey = new PubKey([coordinatorRawPubKey[0], coordinatorRawPubKey[1]]);

  const message = command.encrypt(signature, Keypair.genEcdhSharedKey(encKeyPair.privKey, coordinatorPubKey));
  console.log("message ", message);
  console.log("poll contract", (await maciWrapperContract.read.fetchPoll([BigInt(pollId)])).pollContracts.poll);

  const pollContract = getContract({
    abi: PollAbi,
    address: (await maciWrapperContract.read.fetchPoll([BigInt(pollId)])).pollContracts.poll,
    publicClient: publicClient,
    walletClient: serverWalletClient,
  });

  const tx = await pollContract.write.publishMessage([
    message.asContractParam() as any,
    encKeyPair.pubKey.asContractParam() as any,
  ]);

  console.log(message, tx);

  return NextResponse.json({ message: "The vote is casted successfully" });
};
