import { declareComponent } from '@webflow/react';
import { props } from '@webflow/data-types';
import { CalEmbed } from './CalEmbed';

export default declareComponent(CalEmbed, {
  name: 'Cal Embed',
  description:
    'Cal.com inline booking calendar. Bind Link to the Calls "Cal Link" field. Shows a plain link while loading or if Cal is down.',
  group: 'Shrink',
  props: {
    link: props.Link({ name: 'Cal Link' }),
    fallbackText: props.Text({ name: 'Fallback text', defaultValue: 'Pick a time on Cal.com' }),
    brandColor: props.Text({ name: 'Brand colour', defaultValue: '#1a1c21' }),
    layout: props.Variant({
      name: 'Layout',
      options: ['month_view', 'week_view', 'column_view'],
      defaultValue: 'month_view',
    }),
  },
});
