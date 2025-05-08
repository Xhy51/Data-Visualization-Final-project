// main.js

const CSV_URL = 'sf_aqi_temp_2020_2024.csv';

d3.csv(CSV_URL, d3.autoType)
  .then((data) => {
    const traits = Object.keys(data[0]).filter(
      (c) => c !== 'neighborhood' && c !== 'date',
    );
    const size = 180;
    const padding = 40;
    const groupField = 'neighborhood';

    data.forEach((d) => {
      traits.forEach((t) => {
        d[t] = +d[t];
      });
    });

    const groups = Array.from(
      new Set(data.map((d) => d[groupField])),
    );
    const color = d3
      .scaleOrdinal()
      .domain(groups)
      .range(d3.schemeCategory10);

    // 构建 x/y 尺度
    const xScale = {},
      yScale = {};
    traits.forEach((trait) => {
      const extent = d3.extent(data, (d) => d[trait]);
      xScale[trait] = d3
        .scaleLinear()
        .domain(extent)
        .nice()
        .range([padding / 2, size - padding / 2]);
      yScale[trait] = d3
        .scaleLinear()
        .domain(extent)
        .nice()
        .range([size - padding / 2, padding / 2]);
    });

    // 创建 SVG 容器
    const svg = d3
      .select('#chart')
      .append('svg')
      .attr('width', size * traits.length)
      .attr('height', size * traits.length);

    // 矩阵交叉函数
    function cross(a, b) {
      return a.flatMap((x) => b.map((y) => ({ x, y })));
    }

    // 绘制每个 cell
    svg
      .selectAll('g.cell')
      .data(cross(traits, traits))
      .join('g')
      .attr('class', 'cell')
      .attr('transform', (d) => {
        const i = traits.indexOf(d.x),
          j = traits.indexOf(d.y);
        return `translate(${i * size},${j * size})`;
      })
      .each(function (d) {
        const cell = d3.select(this);

        // 背景框
        cell
          .append('rect')
          .attr('x', padding / 2)
          .attr('y', padding / 2)
          .attr('width', size - padding)
          .attr('height', size - padding)
          .attr('fill', 'none')
          .attr('stroke', '#ccc');

        // 散点
        cell
          .selectAll('circle')
          .data(data)
          .join('circle')
          .attr('cx', (d0) => xScale[d.x](d0[d.x]))
          .attr('cy', (d0) => yScale[d.y](d0[d.y]))
          .attr('r', 3.5)
          .style('fill', (d0) => color(d0[groupField]))
          .style('fill-opacity', 0.7)
          .style('stroke', (d0) =>
            d3.color(color(d0[groupField])).darker(0.5),
          )
          .style('stroke-width', 0.5);

        // 底行添加 x 轴
        if (traits.indexOf(d.y) === traits.length - 1) {
          cell
            .append('g')
            .attr('class', 'x axis')
            .attr(
              'transform',
              `translate(0,${size - padding / 2})`,
            )
            .call(d3.axisBottom(xScale[d.x]).ticks(5))
            .selectAll('text')
            .attr('font-size', '8px');
        }

        // 最左列添加 y 轴
        if (traits.indexOf(d.x) === 0) {
          cell
            .append('g')
            .attr('class', 'y axis')
            .attr(
              'transform',
              `translate(${padding / 2},0)`,
            )
            .call(d3.axisLeft(yScale[d.y]).ticks(5))
            .selectAll('text')
            .attr('font-size', '8px');
        }
      });
  })
  .ca