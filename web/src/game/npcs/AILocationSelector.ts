import { pathfinder } from '../Pathfinding';

export class AILocationSelector {
  getNewTarget(): number {
    return pathfinder.getRandomWaypoint();
  }

  getNewTargetHallway(): number {
    return pathfinder.getRandomHallwayWaypoint();
  }

  getQuarterExclusive(): number {
    // Returns hallway waypoints 1-15 range
    const hallways = [];
    for (let i = 0; i < 16; i++) {
      hallways.push(i);
    }
    return hallways[Math.floor(Math.random() * hallways.length)];
  }
}

export const aiLocationSelector = new AILocationSelector();
