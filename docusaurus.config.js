// @ts-check
import {themes as prismThemes} from 'prism-react-renderer';

const SITE = 'https://frostnav.com';
const PLATFORM = 'https://platform.frostnav.com';
const SITE_URL = 'https://wiki.frostnav.com';

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'FrostNav Wiki',
  tagline: 'Chery multimedya ekranı için FrostNav kurulum ve kullanım rehberi',
  favicon: 'img/favicon.png',

  url: SITE_URL,
  baseUrl: '/',
  trailingSlash: true,

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  markdown: {
    hooks: {onBrokenMarkdownLinks: 'throw'},
  },

  i18n: {
    defaultLocale: 'tr',
    locales: ['tr', 'en'],
    localeConfigs: {
      tr: {label: 'Türkçe', htmlLang: 'tr-TR'},
      en: {label: 'English', htmlLang: 'en-US'},
    },
  },

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          routeBasePath: '/',
          sidebarPath: './sidebars.js',
          showLastUpdateTime: true,
          // "Bu sayfayı düzenle" → yönetim panelinde (Decap CMS) aynı sayfa. Koleksiyon adları static/admin/config.yml ile aynı.
          editUrl: ({docPath, locale}) => {
            const [dir, file] = docPath.includes('/') ? docPath.split('/') : ['genel', docPath];
            const collection = `${locale === 'en' ? 'en' : 'tr'}-${dir}`;
            return `${SITE_URL}/admin/#/collections/${collection}/entries/${file.replace(/\.mdx?$/, '')}`;
          },
        },
        blog: false,
        theme: {customCss: './src/css/custom.css'},
        sitemap: {changefreq: 'weekly', priority: 0.5},
      }),
    ],
  ],

  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      /** @type {import('@easyops-cn/docusaurus-search-local').PluginOptions} */
      ({
        hashed: true,
        language: ['tr', 'en'],
        docsRouteBasePath: '/',
        indexBlog: false,
        highlightSearchTermsOnTargetPage: true,
        searchResultLimits: 10,
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      image: 'img/logo.png',
      colorMode: {respectPrefersColorScheme: true},
      docs: {sidebar: {hideable: true}},
      navbar: {
        title: 'FrostNav Wiki',
        logo: {alt: 'FrostNav', src: 'img/logo.png'},
        items: [
          {type: 'docSidebar', sidebarId: 'wiki', position: 'left', label: 'Rehber'},
          {to: '/sss/', label: 'SSS', position: 'left'},
          {href: `${SITE}/install`, label: 'Web Installer', position: 'right'},
          {href: PLATFORM, label: 'Platform', position: 'right'},
          {type: 'localeDropdown', position: 'right'},
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'FrostNav',
            items: [
              {label: 'frostnav.com', href: SITE},
              {label: 'Web Installer', href: `${SITE}/install`},
              {label: 'Platform', href: PLATFORM},
            ],
          },
          {
            title: 'Mobil',
            items: [
              {label: 'App Store', href: 'https://apps.apple.com/tr/app/frostnav/id6829233441'},
              {label: 'Google Play', href: 'https://play.google.com/store/apps/details?id=com.frostblack.frostnav'},
            ],
          },
          {
            title: 'Destek',
            items: [
              {label: 'WhatsApp', href: 'https://chat.whatsapp.com/FoUWKEC0xbr09DtLAgvthg'},
              {label: 'YouTube', href: 'https://www.youtube.com/watch?v=D8KxEsYhqpA'},
            ],
          },
        ],
        copyright: `© ${new Date().getFullYear()} FrostNav`,
      },
      prism: {theme: prismThemes.github, darkTheme: prismThemes.dracula},
    }),
};

export default config;
