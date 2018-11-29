// https://github.com/michael-ciniawsky/postcss-load-config

module.exports = {
  plugins: {
    'postcss-import': {},
    'postcss-url': {},
    autoprefixer: {},
    'xianyukeji-postcss-px2rem': {
      remUnit: 37.5,
      remResetMeidas: [
        {
          propertys: ['font-size', 'line-height'],
          media: 'screen and (max-width: 374px)',
        },
      ],
      remResetPropertys: [/^border(-)?(top|bottom|left|right)?(-)?(width)?$/],
    },
  },
}
