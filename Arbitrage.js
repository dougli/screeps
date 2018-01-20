const Profiler = require('Profiler');

const MIN_PROFIT_PER_ENERGY = 0.15;
const MAX_TRADE = 10000;
const MAX_ENERGY_PER_TICK = 10;
const TICKS_TO_CLOSE_TRADE = 20;
const WAIT_TIME = 19;

const ARBITRAGE_RESOURCES = [
  RESOURCE_HYDROGEN,
  RESOURCE_OXYGEN,
  RESOURCE_UTRIUM,
  RESOURCE_LEMERGIUM,
  RESOURCE_KEANIUM,
  RESOURCE_ZYNTHIUM,
];

const Arbitrage = {
  run: function(room) {
    if (!room.terminal || !room.terminal.my || room.terminal.cooldown > 0) {
      return;
    }

    // We're in the middle of a deal here!
    let trade = room.memory.arbitrage;
    if (trade && trade.waitTill > Game.time) {
      return;
    }
    if (trade && trade.sell) {
      delete room.memory.arbitrage;

      // Make sure the sell pair has not changed underneath our feet
      const sell = Game.market.getOrderById(trade.sell.id);
      if (sell && sell.price >= trade.sell.price) {
        Game.market.deal(trade.sell.id, trade.amount, room.name);
      }

      return;
    }

    trade = Arbitrage.getBestTrade(room);
    if (trade) {
      Game.market.deal(trade.buy.id, trade.amount, room.name);
      room.memory.arbitrage = trade;
    } else {
      room.memory.arbitrage = {waitTill: Game.time + WAIT_TIME};
    }
  },

  getBestTrade: function(room) {
    const allOrders = Game.market.getAllOrders();

    let bestTrade = null;
    for (const resource of ARBITRAGE_RESOURCES) {
      const orders = allOrders.filter(order => order.resourceType === resource);

      const buys = orders.filter(order => order.type === ORDER_BUY);
      const sells = orders.filter(order => order.type === ORDER_SELL);
      if (!buys.length || !sells.length) {
        continue;
      }

      let best = {
        buy: sells[0],
        sell: buys[0],
        profit: -Number.MAX_VALUE,
      };
      let updated = false;
      do {
        updated = false;
        for (const buy of buys) {
          const result = Arbitrage.evaluateDeal(best.buy, buy, room.name);
          if (result.profit > best.profit) {
            best = result;
            updated = true;
          }
        }

        for (const sell of sells) {
          const result = Arbitrage.evaluateDeal(sell, best.sell, room.name);
          if (result.profit > best.profit) {
            best = result;
            updated = true;
          }
        }
      } while (updated);
      if (best.profitPerEnergy > MIN_PROFIT_PER_ENERGY &&
          (!bestTrade || best.profit > bestTrade.profit)) {
        bestTrade = best;
      }
    }

    return bestTrade && bestTrade.profit > 0 ? bestTrade : null;
  },

  evaluateDeal: function(sell, buy, roomName) {
    let spread = buy.price - sell.price;

    let energyCost = (
      Game.market.calcTransactionCost(1000, roomName, sell.roomName) +
        Game.market.calcTransactionCost(1000, roomName, buy.roomName)
    ) / 1000;

    let amount = Math.min(
      MAX_TRADE,
      sell.amount,
      buy.amount,
      Math.floor(Game.market.credits / sell.price),
      Math.floor(MAX_ENERGY_PER_TICK * TICKS_TO_CLOSE_TRADE / energyCost)
    );

    let profitPerEnergy = spread / energyCost;
    let profit = amount * spread;
    return {buy: sell, sell: buy, amount, profitPerEnergy, profit};
  }
};

Profiler.registerObject(Arbitrage, 'Arbitrage');

module.exports = Arbitrage;
