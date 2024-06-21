import { NextResponse } from "next/server";
import { maciWrapperContract } from "~~/constants";

// uint256 _page,
// uint256 _perPage,
// bool _ascending

(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export const GET = async () => {
  try {
    const polls = await maciWrapperContract.read.fetchPolls([1n, 10n, true]);
    return NextResponse.json({ polls });
  } catch (err) {
    console.log(err);
    return NextResponse.json({ error: "something went wrong" }, { status: 500 });
  }
};
