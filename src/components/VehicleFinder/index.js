import React, {useState} from 'react';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

/*
 * "Aracınızın ekranı hangisine benziyor?" bulucusu. installer.app/src/components/install/VehicleFinder.jsx'in wiki sürümü.
 * Kural: DEVICE EYE PATTERN / Device眼图 varsa ADB anahtarsız açılır → 02.00.00 kurulumu.
 * Düğme yoksa veya araç yeni nesil ekranlıysa (Jaecoo, yeni Tiggo 8) ADB kilitlidir → adbauth.key.
 */

const BUY_URL = 'https://platform.frostnav.com/buy';
const INSTALLER_URL = 'https://app.frostnav.com';
const LEGACY = '02.00.00';

const CABINS = [
  {id: 'jaecoo', img: require('@site/assets/finder/cabin-jaecoo.webp').default, locked: true},
  {id: 'tiggoNew', img: require('@site/assets/finder/cabin-tiggo-new.webp').default, locked: true},
  {id: 'tiggoClassic', img: require('@site/assets/finder/cabin-tiggo-classic.webp').default, locked: false},
];

const STEPS = {
  settings: {img: require('@site/assets/finder/step-settings.webp').default, spots: [[82.2, 92.5]]},
  dot: {img: require('@site/assets/finder/step-system-dot.webp').default, spots: [[96.1, 54.8]]},
  usb: {img: require('@site/assets/finder/step-engmode.webp').default, spots: [[8.2, 74.3]]},
  eye: {img: require('@site/assets/finder/step-device-eye.webp').default, spots: [[40.9, 84.4]]},
  version: {img: require('@site/assets/finder/step-engmode.webp').default, spots: [[8.2, 22.6]]},
  newHome: {img: require('@site/assets/finder/new-home.webp').default, spots: [[43.6, 22.9]]},
  newSystem: {img: require('@site/assets/finder/new-system.webp').default, spots: [[13.1, 78.2], [32.0, 16.2]]},
  newVersion: {img: require('@site/assets/finder/new-engmode.webp').default, spots: [[9.2, 15.5]]},
  jaecooSystem: {img: require('@site/assets/finder/jaecoo-system.webp').default, spots: [[16.4, 69.9]], portrait: true},
  jaecooVersionLabel: {img: require('@site/assets/finder/jaecoo-system.webp').default, spots: [[40.2, 54.0]], portrait: true},
  jaecooEngmode: {img: require('@site/assets/finder/jaecoo-engmode.webp').default, spots: [[16.1, 14.2]], portrait: true},
};

/* Product ID adımları (adbauth.web Customer_Pid_* ile aynı). img yoksa yalnızca metin. */
const PID_STEPS = {
  tiggoClassic: [['settings', 'classic1'], ['dot', 'classic2'], ['version', 'classic3']],
  tiggoNew: [['newHome', 'new1'], ['newSystem', 'new2'], ['newVersion', 'new3']],
  jaecoo: [['jaecooSystem', 'jaecoo1'], ['jaecooVersionLabel', 'jaecoo2'], ['jaecooEngmode', 'jaecoo3']],
};

const QUESTION_ORDER = ['model', 'settings', 'dot', 'usb', 'eye'];

const TEXT = {
  tr: {
    count: (c, t) => `Soru ${c} / ${t}`,
    result: 'Sonuç',
    restart: 'Baştan başla',
    back: 'Geri',
    model: {
      title: 'Aracınızın ekranı hangisine benziyor?',
      lead: 'Ön paneldeki ekrana bakın ve en yakın olanı seçin.',
      jaecoo: 'Jaecoo',
      jaecooHint: 'Ortada dikey, büyük ekran',
      tiggoNew: 'Tiggo 8 (yeni nesil)',
      tiggoNewHint: 'Panelin üstünde duran tek parça yatay ekran',
      tiggoClassic: 'Tiggo 7 / Tiggo 8 / Omoda 5',
      tiggoClassicHint: 'Gösterge ve multimedya yan yana, çift ekran (genelde 2025, 145 HP)',
    },
    settings: {
      title: 'Ayarlar çarkına dokunun',
      lead: 'Araç ekranının alt çubuğunda, sağ taraftaki çark simgesine dokunun. Ayarlar açılır.',
      alt: 'Araç ana ekranı; alt çubukta ayarlar çarkı işaretli',
      done: 'Ayarlar açıldı',
    },
    dot: {
      title: "Sistem'deki küçük noktaya hızlıca dokunun",
      lead: "Soldan Sistem'i seçin. Görselin en sağındaki küçük noktaya art arda hızlıca dokunun (yaklaşık 10 kez). Mühendislik menüsü açılır.",
      alt: 'Sistem ayarları; sağdaki küçük nokta işaretli',
      tip: 'Açılmazsa biraz daha hızlı ve aralıksız dokunun. Menü siyah ekranda düğmelerle açılır.',
      done: 'Mühendislik menüsü açıldı',
    },
    usb: {
      title: 'USB2.0 AUTH yazısına dokunun',
      lead: 'Mühendislik menüsünde USB2.0 AUTH / USB2.0认证 düğmesine dokunun.',
      alt: 'Mühendislik menüsü; USB2.0 AUTH düğmesi işaretli',
      done: 'USB ekranı açıldı',
    },
    eye: {
      title: 'DEVICE EYE PATTERN düğmesi var mı?',
      lead: 'Açılan USB ekranında DEVICE EYE PATTERN / Device眼图 düğmesini arayın. Varsa soldaki (USB1 altındaki) düğmeye dokunun; ADB açılır.',
      alt: 'USB2.0 AUTH ekranı; soldaki (USB1) DEVICE EYE PATTERN düğmesi işaretli',
      yes: 'Var, dokundum',
      no: 'Yok, göremiyorum',
    },
    legacy: {
      title: 'ADB açık, anahtar gerekmez',
      body: `DEVICE EYE PATTERN ile aracınızda ADB açıldı. adbauth.key almanıza gerek yok. Web yükleyicide kurulum tipi olarak "${LEGACY}" seçin.`,
      guide: `${LEGACY} kurulum rehberi`,
      installer: 'Web yükleyiciyi aç',
    },
    key: {
      title: 'ADB kilitli: adbauth.key gerekir',
      reasonModel: 'Bu ekrana sahip araçlarda ADB kilitlidir. Mühendislik menüsünden açılmaz.',
      reasonNoEye: 'DEVICE EYE PATTERN düğmesi yoksa aracınızda ADB kilitlidir.',
      body: 'ADB\'yi açmak için adbauth.key gerekir. Satın alırken araçtaki VERSION INFO / 版本信息 ekranındaki productID / 产品序列号 değerini girersiniz.',
      pidTitle: "Product ID'yi şimdi alın",
      pidBody: 'Mühendislik menüsü zaten açık. Back ile ana menüye dönün ve VERSION INFO / 版本信息 düğmesine dokunun. productID / 产品序列号 satırındaki 15 haneli sayıyı not edin; adbauth.key alırken bu gerekir.',
      pidAlt: 'Mühendislik menüsü; VERSION INFO düğmesi işaretli',
      pidModel: 'Product ID\'yi şimdi alın',
      buy: 'adbauth.key satın al',
      guide: 'ADB Kilid kurulum rehberi',
    },
    pid: {
      classic1: 'Alt çubuğun sağındaki ayarlar çarkına dokunun.',
      classic2: "Soldan Sistem'i seçin. Görselin en sağındaki küçük noktaya art arda hızlıca dokunun (yaklaşık 10 kez). Gizli menü açılır.",
      classic3: 'Gizli menüde VERSION INFO / 版本信息 düğmesine dokunun.',
      new1: "Araç ekranında uygulamalar arasından Ayarlar'a dokunun.",
      new2: "Soldan Sistem'i seçin. Sağ üstteki Hakkında başlığına art arda hızlıca dokunun. Gizli menü açılır.",
      new3: 'Gizli menüde VERSION INFO / 版本信息 düğmesine dokunun.',
      jaecoo1: "Araç ekranında Ayarlar'ı (Araç merkezi) açın. Soldan Sistem'i seçin.",
      jaecoo2: 'Sağdaki Versiyon bilgisi yazısına art arda hızlıca dokunun. Gizli menü (EngMode) açılır.',
      jaecoo3: 'Gizli menüde VERSION INFO / 版本信息 düğmesine dokunun.',
      read: 'productID / 产品序列号 satırının sağındaki 15 haneli sayıyı not edin. 0 (sıfır) ile O (harf) karıştırmayın.',
      alt: (n) => `Adım ${n}`,
    },
  },
  en: {
    count: (c, t) => `Question ${c} of ${t}`,
    result: 'Result',
    restart: 'Start over',
    back: 'Back',
    model: {
      title: "Which screen looks like your car's?",
      lead: 'Look at the screen on the dashboard and pick the closest one.',
      jaecoo: 'Jaecoo',
      jaecooHint: 'Large portrait screen in the middle',
      tiggoNew: 'Tiggo 8 (new generation)',
      tiggoNewHint: 'Single landscape screen standing on top of the dashboard',
      tiggoClassic: 'Tiggo 7 / Tiggo 8 / Omoda 5',
      tiggoClassicHint: 'Cluster and multimedia side by side, dual screen (usually 2025, 145 HP)',
    },
    settings: {
      title: 'Tap the settings gear',
      lead: "On the car screen's bottom bar, tap the gear icon on the right. Settings opens.",
      alt: 'Car home screen; settings gear on the bottom bar highlighted',
      done: 'Settings is open',
    },
    dot: {
      title: 'Tap the small dot in System quickly',
      lead: 'Pick System on the left. Tap the small dot at the far right of the picture quickly and repeatedly (about 10 times). The engineering menu opens.',
      alt: 'System settings; small dot on the right highlighted',
      tip: "If it doesn't open, tap a bit faster without pausing. The menu opens on a black screen with buttons.",
      done: 'Engineering menu is open',
    },
    usb: {
      title: 'Tap USB2.0 AUTH',
      lead: 'In the engineering menu, tap USB2.0 AUTH / USB2.0认证.',
      alt: 'Engineering menu; USB2.0 AUTH button highlighted',
      done: 'USB screen is open',
    },
    eye: {
      title: 'Is there a DEVICE EYE PATTERN button?',
      lead: "On the USB screen, look for DEVICE EYE PATTERN / Device眼图. If it's there, tap the one on the left (under USB1); ADB turns on.",
      alt: 'USB2.0 AUTH screen; the left DEVICE EYE PATTERN button (USB1) highlighted',
      yes: 'Yes, I tapped it',
      no: "No, I can't see it",
    },
    legacy: {
      title: 'ADB is on, no key needed',
      body: `DEVICE EYE PATTERN turned ADB on in your car. You don't need an adbauth.key. Choose "${LEGACY}" as the install type in the web installer.`,
      guide: `${LEGACY} install guide`,
      installer: 'Open the web installer',
    },
    key: {
      title: 'ADB is locked: adbauth.key needed',
      reasonModel: "Cars with this screen have ADB locked. It can't be turned on from the engineering menu.",
      reasonNoEye: 'Without the DEVICE EYE PATTERN button, ADB is locked in your car.',
      body: "You need an adbauth.key to turn ADB on. When buying, enter the productID / 产品序列号 from the car's VERSION INFO / 版本信息 screen.",
      pidTitle: 'Get your Product ID now',
      pidBody: 'The engineering menu is already open. Press Back to the main menu and tap VERSION INFO / 版本信息. Write down the 15-digit number next to productID / 产品序列号; you need it to buy the adbauth.key.',
      pidAlt: 'Engineering menu; VERSION INFO button highlighted',
      pidModel: 'Get your Product ID now',
      buy: 'Buy adbauth.key',
      guide: 'ADB Lock install guide',
    },
    pid: {
      classic1: 'Tap the settings gear on the right of the bottom bar.',
      classic2: 'Pick System on the left. Tap the small dot at the far right of the picture quickly and repeatedly (about 10 times). The hidden menu opens.',
      classic3: 'In the hidden menu, tap VERSION INFO / 版本信息.',
      new1: 'On the car screen, tap Settings among the apps.',
      new2: 'Pick System on the left. Tap the About heading at the top right quickly and repeatedly. The hidden menu opens.',
      new3: 'In the hidden menu, tap VERSION INFO / 版本信息.',
      jaecoo1: 'Open Settings (Vehicle center) on the car screen. Pick System on the left.',
      jaecoo2: 'Tap the Version info label on the right quickly and repeatedly. The hidden menu (EngMode) opens.',
      jaecoo3: 'In the hidden menu, tap VERSION INFO / 版本信息.',
      read: "Write down the 15-digit number next to productID / 产品序列号. Don't mix up 0 (zero) and O (letter).",
      alt: (n) => `Step ${n}`,
    },
  },
};

function useText() {
  const {i18n} = useDocusaurusContext();
  return TEXT[i18n.currentLocale] || TEXT.tr;
}

/** Ekran tipine göre Product ID adımları. Sihirbazda ve ADB Kilid sayfasında kullanılır. */
export function ProductIdSteps({cabin}) {
  const t = useText();
  return (
    <>
      <ol className={styles.pidSteps}>
        {PID_STEPS[cabin].map(([img, key], i) => (
          <li key={key}>
            <span>{t.pid[key]}</span>
            {img && <Shot step={img} alt={t.pid.alt(i + 1)} />}
          </li>
        ))}
      </ol>
      <p className={styles.pidRead}>{t.pid.read}</p>
    </>
  );
}

function Shot({step, alt}) {
  const {img, spots, portrait} = STEPS[step];
  return (
    <figure className={portrait ? `${styles.shot} ${styles.portrait}` : styles.shot}>
      <img src={img} alt={alt} loading="lazy" decoding="async" />
      {spots.map(([x, y]) => (
        <span key={`${x}-${y}`} className={styles.spot} style={{left: `${x}%`, top: `${y}%`}} aria-hidden="true" />
      ))}
    </figure>
  );
}

function Actions({children}) {
  return <div className={styles.actions}>{children}</div>;
}

export default function VehicleFinder() {
  const t = useText();
  const [history, setHistory] = useState(['model']);
  const [cabin, setCabin] = useState(null);
  const current = history[history.length - 1];
  const go = (next) => setHistory((items) => [...items, next]);
  const back = () => setHistory((items) => (items.length > 1 ? items.slice(0, -1) : items));
  const restart = () => { setHistory(['model']); setCabin(null); };
  const questionIndex = QUESTION_ORDER.indexOf(current);
  const lockedByModel = current === 'key' && cabin && cabin.locked;

  const step = (id, next) => (
    <>
      <h3 className={styles.title}>{t[id].title}</h3>
      <p className={styles.lead}>{t[id].lead}</p>
      <Shot step={id} alt={t[id].alt} />
      {t[id].tip && <p className={styles.tip}>{t[id].tip}</p>}
      <Actions>
        <button type="button" className="button button--secondary" onClick={back}>{t.back}</button>
        <button type="button" className="button button--primary" onClick={() => go(next)}>{t[id].done}</button>
      </Actions>
    </>
  );

  return (
    <div className={styles.finder} aria-live="polite">
      <div className={styles.top}>
        <span className={styles.count}>
          {questionIndex >= 0 ? t.count(questionIndex + 1, QUESTION_ORDER.length) : t.result}
        </span>
        {history.length > 1 && (
          <button type="button" className={styles.linkButton} onClick={restart}>{t.restart}</button>
        )}
      </div>

      {current === 'model' && (
        <>
          <h3 className={styles.title}>{t.model.title}</h3>
          <p className={styles.lead}>{t.model.lead}</p>
          <div className={styles.cabins}>
            {CABINS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={styles.cabin}
                onClick={() => { setCabin(c); go(c.locked ? 'key' : 'settings'); }}>
                <img src={c.img} alt="" loading="lazy" decoding="async" />
                <span className={styles.cabinName}>{t.model[c.id]}</span>
                <span className={styles.cabinHint}>{t.model[`${c.id}Hint`]}</span>
              </button>
            ))}
          </div>
        </>
      )}

      {current === 'settings' && step('settings', 'dot')}
      {current === 'dot' && step('dot', 'usb')}
      {current === 'usb' && step('usb', 'eye')}

      {current === 'eye' && (
        <>
          <h3 className={styles.title}>{t.eye.title}</h3>
          <p className={styles.lead}>{t.eye.lead}</p>
          <Shot step="eye" alt={t.eye.alt} />
          <div className={styles.answers}>
            <button type="button" className="button button--primary" onClick={() => go('legacy')}>{t.eye.yes}</button>
            <button type="button" className="button button--secondary" onClick={() => go('key')}>{t.eye.no}</button>
          </div>
          <Actions>
            <button type="button" className="button button--secondary" onClick={back}>{t.back}</button>
          </Actions>
        </>
      )}

      {current === 'legacy' && (
        <div className={`${styles.result} ${styles.ok}`}>
          <h3 className={styles.title}>{t.legacy.title}</h3>
          <p>{t.legacy.body}</p>
          <p className={styles.links}>
            <Link className="button button--primary" to="/kurulum/02-00-00/">{t.legacy.guide}</Link>
            <a href={INSTALLER_URL} target="_blank" rel="noopener noreferrer">{t.legacy.installer}</a>
          </p>
          <Actions>
            <button type="button" className="button button--secondary" onClick={back}>{t.back}</button>
          </Actions>
        </div>
      )}

      {current === 'key' && (
        <div className={`${styles.result} ${styles.key}`}>
          <h3 className={styles.title}>{t.key.title}</h3>
          <p>{lockedByModel ? t.key.reasonModel : t.key.reasonNoEye}</p>
          <p>{t.key.body}</p>
          {lockedByModel ? (
            <div className={styles.pid}>
              <strong>{t.key.pidModel}</strong>
              <ProductIdSteps cabin={cabin.id} />
            </div>
          ) : (
            <div className={styles.pid}>
              <strong>{t.key.pidTitle}</strong>
              <p>{t.key.pidBody}</p>
              <Shot step="version" alt={t.key.pidAlt} />
            </div>
          )}
          <p className={styles.links}>
            <a className={styles.buy} href={BUY_URL} target="_blank" rel="noopener noreferrer">{t.key.buy}</a>
            <Link to="/kurulum/adb-kilid/">{t.key.guide}</Link>
          </p>
          <Actions>
            <button type="button" className="button button--secondary" onClick={back}>{t.back}</button>
          </Actions>
        </div>
      )}
    </div>
  );
}
