/**
 * Dice Rolling Utilities
 * 
 * Handles all dice rolling mechanics for D&D 5e
 */

export interface DiceRollResult {
  notation: string;
  rolls: number[];
  total: number;
  modifier: number;
  breakdown: string;
}

/**
 * Roll dice using standard notation (e.g., "2d6+3", "1d20", "4d6kh3")
 */
export function rollDice(notation: string): DiceRollResult {
  // Parse dice notation
  const match = notation.match(/(\d*)d(\d+)([+-]\d+)?/i);
  
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }
  
  const [, countStr, sidesStr, modifierStr] = match;
  const count = countStr ? parseInt(countStr, 10) : 1;
  const sides = parseInt(sidesStr, 10);
  const modifier = modifierStr ? parseInt(modifierStr, 10) : 0;
  
  // Validate
  if (count < 1 || count > 100) {
    throw new Error(`Invalid dice count: ${count} (must be 1-100)`);
  }
  if (sides < 2 || sides > 1000) {
    throw new Error(`Invalid dice sides: ${sides} (must be 2-1000)`);
  }
  
  // Roll the dice
  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }
  
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  const breakdown = `${rolls.join(' + ')}${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''}`;
  
  return {
    notation,
    rolls,
    total,
    modifier,
    breakdown,
  };
}

/**
 * Roll with advantage (roll twice, take higher)
 */
export function rollWithAdvantage(sides: number, modifier: number = 0): DiceRollResult {
  const roll1 = Math.floor(Math.random() * sides) + 1;
  const roll2 = Math.floor(Math.random() * sides) + 1;
  const higher = Math.max(roll1, roll2);
  
  return {
    notation: `1d20adv${modifier !== 0 ? `${modifier >= 0 ? '+' : ''}${modifier}` : ''}`,
    rolls: [roll1, roll2],
    total: higher + modifier,
    modifier,
    breakdown: `[${roll1}, ${roll2}] → ${higher}${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''}`,
  };
}

/**
 * Roll with disadvantage (roll twice, take lower)
 */
export function rollWithDisadvantage(sides: number, modifier: number = 0): DiceRollResult {
  const roll1 = Math.floor(Math.random() * sides) + 1;
  const roll2 = Math.floor(Math.random() * sides) + 1;
  const lower = Math.min(roll1, roll2);
  
  return {
    notation: `1d20dis${modifier !== 0 ? `${modifier >= 0 ? '+' : ''}${modifier}` : ''}`,
    rolls: [roll1, roll2],
    total: lower + modifier,
    modifier,
    breakdown: `[${roll1}, ${roll2}] → ${lower}${modifier !== 0 ? ` ${modifier >= 0 ? '+' : ''}${modifier}` : ''}`,
  };
}

/**
 * Roll ability check with proficiency
 */
export function rollAbilityCheck(
  abilityScore: number,
  proficient: boolean,
  proficiencyBonus: number,
  advantage?: 'normal' | 'advantage' | 'disadvantage'
): DiceRollResult {
  const modifier = Math.floor((abilityScore - 10) / 2);
  const totalModifier = modifier + (proficient ? proficiencyBonus : 0);
  
  switch (advantage) {
    case 'advantage':
      return rollWithAdvantage(20, totalModifier);
    case 'disadvantage':
      return rollWithDisadvantage(20, totalModifier);
    default:
      return rollDice(`1d20${totalModifier >= 0 ? '+' : ''}${totalModifier}`);
  }
}

/**
 * Roll attack
 */
export function rollAttack(
  attackBonus: number,
  damageDice: string,
  advantage?: 'normal' | 'advantage' | 'disadvantage'
): { attack: DiceRollResult; damage?: DiceRollResult; critical: boolean } {
  const attackRoll = advantage === 'advantage'
    ? rollWithAdvantage(20, attackBonus)
    : advantage === 'disadvantage'
    ? rollWithDisadvantage(20, attackBonus)
    : rollDice(`1d20${attackBonus >= 0 ? '+' : ''}${attackBonus}`);
  
  const natural20 = attackRoll.rolls[0] === 20;
  const critical = natural20;
  
  // Roll damage
  const damageRoll = rollDice(damageDice);
  
  // If critical, double the damage dice
  if (critical) {
    const extraDamage = rollDice(damageDice);
    damageRoll.total += extraDamage.total;
    damageRoll.rolls = [...damageRoll.rolls, ...extraDamage.rolls];
    damageRoll.breakdown += ` + ${extraDamage.breakdown} (CRITICAL!)`;
  }
  
  return {
    attack: attackRoll,
    damage: damageRoll,
    critical,
  };
}

/**
 * Roll initiative
 */
export function rollInitiative(dexterityModifier: number): DiceRollResult {
  return rollDice(`1d20${dexterityModifier >= 0 ? '+' : ''}${dexterityModifier}`);
}

/**
 * Roll saving throw
 */
export function rollSavingThrow(
  abilityScore: number,
  proficient: boolean,
  proficiencyBonus: number,
  advantage?: 'normal' | 'advantage' | 'disadvantage'
): DiceRollResult {
  return rollAbilityCheck(abilityScore, proficient, proficiencyBonus, advantage);
}

/**
 * Generate random number in range (for DM use)
 */
export function randomInRange(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Roll multiple dice types at once (e.g., fireball: 8d6)
 */
export function rollMultiple(notation: string, times: number = 1): DiceRollResult[] {
  const results: DiceRollResult[] = [];
  for (let i = 0; i < times; i++) {
    results.push(rollDice(notation));
  }
  return results;
}

/**
 * Calculate average roll for dice notation (useful for quick NPC stats)
 */
export function averageRoll(notation: string): number {
  const match = notation.match(/(\d*)d(\d+)([+-]\d+)?/i);
  
  if (!match) {
    throw new Error(`Invalid dice notation: ${notation}`);
  }
  
  const [, countStr, sidesStr, modifierStr] = match;
  const count = countStr ? parseInt(countStr, 10) : 1;
  const sides = parseInt(sidesStr, 10);
  const modifier = modifierStr ? parseInt(modifierStr, 10) : 0;
  
  // Average of 1dN is (N+1)/2
  const averagePerDie = (sides + 1) / 2;
  return Math.round(count * averagePerDie + modifier);
}
