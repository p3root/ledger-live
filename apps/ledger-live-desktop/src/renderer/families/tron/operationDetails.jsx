// @flow
/* eslint-disable consistent-return */
import React, { useCallback } from "react";

import { BigNumber } from "bignumber.js";

import type { Currency, Unit, Operation, Account } from "@ledgerhq/live-common/types/index";
import type { Vote } from "@ledgerhq/live-common/families/tron/types";

import { getDefaultExplorerView, getAddressExplorer } from "@ledgerhq/live-common/explorers";

import { openURL } from "~/renderer/linking";

import {
  OpDetailsTitle,
  Address,
  OpDetailsData,
  OpDetailsVoteData,
  OpDetailsSection,
} from "~/renderer/drawers/OperationDetails/styledComponents";
import { Trans } from "react-i18next";
import Box from "~/renderer/components/Box/Box";
import {
  useTronSuperRepresentatives,
  formatVotes,
} from "@ledgerhq/live-common/families/tron/react";
import Text from "~/renderer/components/Text";
import FormattedVal from "~/renderer/components/FormattedVal";
import CounterValue from "~/renderer/components/CounterValue";
import { useDiscreetMode } from "~/renderer/components/Discreet";

const helpURL = "https://support.ledger.com/hc/en-us/articles/360013062139";

function getURLFeesInfo(op: Operation): ?string {
  if (op.fee.gt(200000)) {
    return helpURL;
  }
}

function getURLWhatIsThis(op: Operation): ?string {
  if (op.type !== "IN" && op.type !== "OUT") {
    return helpURL;
  }
}

type OperationsDetailsVotesProps = {
  votes: ?Array<Vote>,
  account: Account,
  isTransactionField?: boolean,
};

export const OperationDetailsVotes = ({
  votes,
  account,
  isTransactionField,
}: OperationsDetailsVotesProps) => {
  const sp = useTronSuperRepresentatives();
  const formattedVotes = formatVotes(votes, sp);

  const redirectAddress = useCallback(
    address => {
      const url = getAddressExplorer(getDefaultExplorerView(account.currency), address);
      if (url) openURL(url);
    },
    [account],
  );
  const discreet = useDiscreetMode();

  return (
    <OpDetailsSection>
      {!isTransactionField && (
        <OpDetailsTitle>
          <Trans
            i18nKey={"operationDetails.extra.votes"}
            values={{ number: votes && votes.length }}
          />
        </OpDetailsTitle>
      )}
      <Box>
        {sp.length > 0 &&
          formattedVotes &&
          formattedVotes.length > 0 &&
          formattedVotes.map(({ voteCount, address, validator }, i) => (
            <OpDetailsData key={address + i} justifyContent="flex-start">
              <OpDetailsVoteData>
                <Box>
                  <Text>
                    <Trans
                      i18nKey="operationDetails.extra.votesAddress"
                      values={{
                        votes: !discreet ? voteCount : "***",
                        name: validator && validator.name,
                      }}
                    >
                      <Text ff="Inter|SemiBold">{""}</Text>
                      {""}
                      <Text ff="Inter|SemiBold">{""}</Text>
                    </Trans>
                  </Text>
                </Box>
                <Address onClick={() => redirectAddress(address)}>{address}</Address>
              </OpDetailsVoteData>
            </OpDetailsData>
          ))}
      </Box>
    </OpDetailsSection>
  );
};

type OperationDetailsExtraProps = {
  extra: { [key: string]: any },
  type: string,
  account: Account,
};

const OperationDetailsExtra = ({ extra, type, account }: OperationDetailsExtraProps) => {
  switch (type) {
    case "VOTE": {
      const { votes } = extra;
      if (!votes || !votes.length) return null;

      return <OperationDetailsVotes votes={votes} account={account} />;
    }
    case "FREEZE":
      return (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey="operationDetails.extra.frozenAmount" />
          </OpDetailsTitle>
          <OpDetailsData>
            <Box>
              <FormattedVal
                val={extra.frozenAmount}
                unit={account.unit}
                showCode
                fontSize={4}
                color="palette.text.shade60"
              />
            </Box>
          </OpDetailsData>
        </OpDetailsSection>
      );
    case "UNFREEZE":
      return (
        <OpDetailsSection>
          <OpDetailsTitle>
            <Trans i18nKey="operationDetails.extra.unfreezeAmount" />
          </OpDetailsTitle>
          <OpDetailsData>
            <Box>
              <FormattedVal
                val={extra.unfreezeAmount}
                unit={account.unit}
                showCode
                fontSize={4}
                color="palette.text.shade60"
              />
            </Box>
          </OpDetailsData>
        </OpDetailsSection>
      );
    default:
      return null;
  }
};

type Props = {
  operation: Operation,
  currency: Currency,
  unit: Unit,
};

const FreezeAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = new BigNumber(operation.extra ? operation.extra.frozenAmount : 0);

  return (
    !amount.isZero() && (
      <>
        <FormattedVal
          val={amount}
          unit={unit}
          showCode
          fontSize={4}
          color={"palette.text.shade80"}
        />

        <CounterValue
          color="palette.text.shade60"
          fontSize={3}
          date={operation.date}
          currency={currency}
          value={amount}
        />
      </>
    )
  );
};

const UnfreezeAmountCell = ({ operation, currency, unit }: Props) => {
  const amount = new BigNumber(operation.extra ? operation.extra.unfreezeAmount : 0);

  return (
    !amount.isZero() && (
      <>
        <FormattedVal
          val={amount}
          unit={unit}
          showCode
          fontSize={4}
          color={"palette.text.shade80"}
        />

        <CounterValue
          color="palette.text.shade60"
          fontSize={3}
          date={operation.date}
          currency={currency}
          value={amount}
        />
      </>
    )
  );
};

const VoteAmountCell = ({ operation, currency, unit }: Props) => {
  const discreet = useDiscreetMode();
  const amount =
    operation.extra && operation.extra.votes
      ? operation.extra.votes.reduce((sum, { voteCount }) => sum + voteCount, 0)
      : 0;

  return amount > 0 ? (
    <Text ff="Inter|SemiBold" fontSize={4}>
      <Trans
        i18nKey={"operationDetails.extra.votes"}
        values={{
          number: !discreet ? amount : "***",
        }}
      />
    </Text>
  ) : null;
};

const amountCellExtra = {
  FREEZE: FreezeAmountCell,
  UNFREEZE: UnfreezeAmountCell,
  VOTE: VoteAmountCell,
};

export default {
  getURLFeesInfo,
  getURLWhatIsThis,
  OperationDetailsExtra,
  amountCellExtra,
};
