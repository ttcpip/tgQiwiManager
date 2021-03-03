module.exports = {
  walletsListHandler: require('./walletsList'),
  walletsBalancesHandler: require('./walletsBalances'),
  withdrawHandler: require('./withdraw'),
  statListHandler: require('./statList'),
  accStatsHandler: require('./accStats'),
  historyListHandler: require('./historyList'),
  accHistoryHandler: require('./accHistory'),
  autoWithdrawListHandler: require('./autoWithdrawList'),
  accAutoWithdrawHandler: require('./accAutoWithdraw'),
  onOffAutoWithdrawHandler: require('./onOffAutoWithdraw'),
  changeAutoWithdrawThresholdAndCardHandler: require('./changeAutoWithdrawThresholdAndCard'),
}
