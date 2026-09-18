import { T } from '../core/config.js';
import { R } from '../core/utils.js';
import { addBlood } from '../world/grid.js';
import { Decals } from '../fx/decals.js';
import { SPR } from '../assets/spriteGen.js';
import { enemies, spawnEnemy, ET } from './enemies.js';
import { Projectiles, barrels } from './projectiles.js';

export const pickups = [];
export const corpses = [];
export const terms = [];
export const switches = [];

export const LORE = [
    { t: 'РАССЫЛКА #044', b: '«Напоминаем: биомасса, сданная в Перерабатывающий цех, возвращается в виде канцелярских принадлежностей. Это не повод для слухов. Это повод для гордости.»' },
    { t: 'ПРОТОКОЛ ЗАСЕДАНИЯ', b: '«Пункт 3. О сокращении штата на 100%. Голосовали: единогласно. Возражавший сотрудник направлен на переработку первым.»' },
    { t: 'ЛИЧНОЕ ДЕЛО 04-116', b: '«Ваш предшественник пытался выйти через вентиляцию. Вентиляция ведёт в цех. Всё ведёт в цех.»' },
    { t: 'СЕРВЕРНЫЙ ЖУРНАЛ', b: '«ЗАПРОС: утилизация/персонал/Б-13 → ОТВЕТ: 24 ЕД. В ОЖИДАНИИ. ПРИМЕЧАНИЕ: директор требует свежее.»' },
    { t: 'ИНСТРУКЦИЯ ПО ОХРАНЕ ТРУДА', b: '«П.12.4: При контакте с токсичными разливами сотрудник обязан продолжить работу. П.12.5: Электроловушки установлены для повышения внимательности. П.12.6: Расчленение не является основанием для больничного.»' },
    { t: 'ЗАПИСКА ОХРАННИКА', b: '«Дроны снова летают по ночам. Они сканируют. Они запоминают. Если дрон мигает красным — беги. Если жёлтым — уже поздно.»' },
    { t: 'ЧЕРНОВИК ЗАЯВЛЕНИЯ', b: '«Прошу уволить по собственному... [ЗАЧЁРКНУТО] ...прошу продолжить работу вечно. С уважением, сотрудник 03-091.»' },
    { t: 'РЕЦЕПТ СТОЛОВОЙ', b: '«Суп дня: бульон на основе биомассы. Салат: бумага shredded. Десерт: скрепки в карамели. Приятного аппетита!»' },
];

export function initEntities() {
    enemies.length = 0; pickups.length = 0; corpses.length = 0;
    terms.length = 0; barrels.length = 0; switches.length = 0;
    Projectiles.list.length = 0;

    const put = (c, x, y) => {
        switch (c) {
            case 'i': spawnEnemy(ET.INTERN, x, y); break;
            case 'm': spawnEnemy(ET.MANAGER, x, y); break;
            case 'g': spawnEnemy(ET.GUARD, x, y); break;
            case 'C': spawnEnemy(ET.CEO, x, y); break;
            case 'j': spawnEnemy(ET.JANITOR, x, y); break;
            case 'd': spawnEnemy(ET.DRONE, x, y); break;
            case 'h': pickups.push({ t: 'med', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case 'a': pickups.push({ t: 'ammo', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case 'k': pickups.push({ t: 'shell', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case 'r': pickups.push({ t: 'rock', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case 'v': pickups.push({ t: 'armor', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case 'K': pickups.push({ t: 'key', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case '2': pickups.push({ t: 'shotgun', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case '4': pickups.push({ t: 'stapler', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case '5': pickups.push({ t: 'nailgun', x: x + .5, y: y + .5, bob: R() * 6 }); break;
            case 'b': barrels.push({ x: x + .5, y: y + .5, exploded: 0, timer: 0, hp: 15 }); break;
            case 'c':
                corpses.push({ x: x + .5, y: y + .5, tex: SPR[['intern', 'manager', 'guard'][R() * 3 | 0] + 'D'], sH: .28, zB: 0 });
                addBlood(x + .5, y + .5, .5); break;
            case 'u': corpses.push({ x: x + .5, y: y + .5, tex: SPR.cooler, sH: .95, zB: 0, solid: 1 }); break;
            case '1':
                terms.push({ x: x + .5, y: y + .5, lore: terms.length % LORE.length });
                corpses.push({ x: x + .5, y: y + .5, tex: SPR.term, sH: .85, zB: 0, solid: 1 }); break;
            case 'w':
                switches.push({ x: x + .5, y: y + .5, on: false, target: 'lights' });
                corpses.push({ x: x + .5, y: y + .5, tex: SPR.switch, sH: .6, zB: 0, solid: 1 }); break;
        }
    };

    // Враги
    put('i', 22, 20); put('i', 28, 23); put('i', 33, 17); put('i', 12, 14); put('i', 8, 30); put('i', 13, 36);
    put('i', 26, 31); put('i', 44, 24); put('i', 52, 36); put('i', 24, 14); put('i', 55, 30); put('i', 48, 42);
    put('m', 23, 5); put('m', 27, 8); put('m', 35, 4); put('m', 48, 7); put('m', 46, 30); put('m', 33, 14); put('m', 55, 40);
    put('g', 54, 3); put('g', 5, 38); put('g', 43, 33); put('g', 55, 22); put('g', 58, 35);
    put('C', 52, 38);
    put('j', 7, 26); put('j', 10, 35); put('j', 20, 37); put('j', 44, 28); put('j', 5, 42);
    put('d', 45, 5); put('d', 50, 8); put('d', 30, 20); put('d', 25, 25); put('d', 48, 30); put('d', 52, 24); put('d', 56, 15); put('d', 60, 40);

    // Подбираемое
    put('h', 10, 2); put('h', 34, 9); put('h', 14, 37); put('h', 26, 31); put('h', 45, 40); put('h', 22, 39); put('h', 56, 40); put('h', 5, 45);
    put('a', 24, 14); put('a', 3, 26); put('a', 20, 35); put('a', 30, 30); put('a', 18, 9); put('a', 42, 22); put('a', 53, 14);
    put('k', 13, 28); put('k', 30, 30); put('k', 42, 22); put('k', 19, 36);
    put('r', 2, 16); put('r', 44, 38); put('r', 3, 22); put('r', 55, 15);
    put('2', 20, 26); put('4', 2, 22); put('5', 34, 6); put('v', 19, 38); put('K', 56, 3);

    // Бочки
    put('b', 11, 33); put('b', 38, 14); put('b', 42, 26); put('b', 47, 22); put('b', 53, 33); put('b', 21, 36);
    put('b', 46, 36); put('b', 52, 38); put('b', 58, 25); put('b', 44, 44);

    // Трупы-декорации
    put('c', 9, 6); put('c', 25, 10); put('c', 33, 14); put('c', 5, 28); put('c', 28, 31); put('c', 21, 38);
    put('c', 45, 34); put('c', 52, 28); put('c', 15, 14); put('c', 21, 6); put('c', 48, 30); put('c', 51, 26); put('c', 57, 42);
    put('u', 14, 2); put('u', 31, 3); put('u', 10, 24);

    // Терминалы и рубильники
    put('1', 36, 3); put('1', 28, 2); put('1', 56, 9); put('1', 20, 39); put('1', 4, 16); put('1', 30, 32); put('1', 54, 14); put('1', 3, 45);
    put('w', 42, 2); put('w', 23, 32); put('w', 55, 16);

    // Пропаганда
    Decals.add(T.DPROP, 6.5, 13.05, .55, .62, 9999, .045, 0);
    Decals.add(T.DPROP + 1, 21.5, 14.95, .55, .62, 9999, .045, 0);
    Decals.add(T.DPROP + 2, 12.5, 24.05, .55, .62, 9999, .045, 0);
    Decals.add(T.DPROP + 3, 38.05, 24.5, .55, .62, 9999, .045, 0);
    Decals.add(T.DPROP + 4, 39.95, 23.5, .55, .62, 9999, .045, 0);
    Decals.add(T.DPROP + 1, 41.05, 30.5, .55, .62, 9999, .045, 0);
    Decals.add(T.DPROP + 3, 30.5, 32.95, .55, .62, 9999, .045, 0);
    Decals.add(T.DPROP, 55.5, 19.05, .55, .62, 9999, .045, 0);
}