import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// import { decodeEventLog } from "viem";
import { maciWrapperContract } from "~~/constants";

const CreatePollSchema = z.object({
  name: z.string(),
  description: z.string(),
  type: z.enum(["removeAdmin", "addAdmin", "removeUser", "addUser"]),
  duration: z.number().int().gt(0),
  telegramChatId: z.string(),
  votingModeQv: z.boolean().default(false),
});

export const POST = async (req: NextRequest) => {
  try {
    // console.log(await req.json());
    let body: typeof CreatePollSchema._type;
    try {
      const { success, error, data } = CreatePollSchema.safeParse(await req.json());
      if (!success) {
        return NextResponse.json({ error: "invalid body", issues: error.issues }, { status: 409 });
      }
      body = data;
    } catch (e) {
      return NextResponse.json({ error: "invalid body" }, { status: 409 });
    }

    const { name, description, duration, telegramChatId, votingModeQv } = body;
    console.log(body);

    // create poll on the maci contract
    // const tx =
    await maciWrapperContract.write.createPoll([
      name,
      ["I agree", "I dont agree"],
      JSON.stringify({ description, telegramChatId }),
      BigInt(duration),
      votingModeQv ? 0 : 1,
    ]);
    // const transaction = await publicClient.getTransactionReceipt({ hash: tx });

    // const events: any[] = [];

    // for (const log of transaction.logs) {
    //   try {
    //     events.push(decodeEventLog({ abi: maciWrapperContract.abi, data: log.data, topics: log.topics }));
    //   } catch (e) { }
    // }

    // const pollCreatedEvent = events.filter(event => event.eventName === "PollCreated")[0];

    return NextResponse.json({ message: "The poll is created successfully" });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "something went wrong" }, { status: 500 });
  }
};
