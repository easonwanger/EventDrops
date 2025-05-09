import * as d3 from 'd3';

import eventDrops from '../src';
import '../src/style.css';
import { gravatar, humanizeDate } from './utils';
import _ from 'lodash';

const repositories = require('./data.json');

const numberCommitsContainer = document.getElementById('numberCommits');
const zoomStart = document.getElementById('zoomStart');
const zoomEnd = document.getElementById('zoomEnd');

function addMoreDummyData(repositories, count = 10) {
    repositories.forEach((repo) => {
        const newCommits = [];
        repo.commits.forEach((commit) => {
            for (let i = 0; i < count; i++) {
                newCommits.push(
                    Object.assign({}, commit, {
                        date: new Date(
                            new Date(commit.date).getTime() +
                                Math.floor(Math.random() * 200000000000)
                        ),
                    })
                );
            }
        });
        newCommits.forEach((commit) => {
            repo.commits.push(commit);
        });
    });
    return repositories;
}
addMoreDummyData(repositories, 1);
// repositories.splice(0,2)
const updateCommitsInformation = (chart) => {
    const filteredData = chart
        .filteredData()
        .reduce((total, repo) => total.concat(repo.data), []);

    numberCommitsContainer.textContent = filteredData.length;
    zoomStart.textContent = humanizeDate(chart.scale().domain()[0]);
    zoomEnd.textContent = humanizeDate(chart.scale().domain()[1]);
};

const tooltip = d3
    .select('body')
    .append('div')
    .classed('tooltip', true)
    .style('opacity', 0)
    .style('pointer-events', 'auto');

const repositoriesData = repositories.map((repository) => ({
    name: repository.name,
    data: repository.commits,
}));
const chart = eventDrops({
    dropsData: repositoriesData,
    zoom: {
        onZoomEnd: () => updateCommitsInformation(chart),
    },
    drop: {
        getDate: (d) => new Date(d.date),
        onMouseOver: (ev, commit) => {
            tooltip
                .transition()
                .duration(200)
                .style('opacity', 1)
                .style('pointer-events', 'auto');

            tooltip
                .html(
                    `
                    <div class="commit">
                    <img class="avatar" src="${gravatar(
                        commit.author.email
                    )}" alt="${commit.author.name}" title="${
                        commit.author.name
                    }" />
                    <div class="content">
                        <h3 class="message">${commit.message}</h3>
                        <p>
                            <a href="https://www.github.com/${
                                commit.author.name
                            }" class="author">${commit.author.name}</a>
                            on <span class="date">${humanizeDate(
                                new Date(commit.date)
                            )}</span> -
                            <a class="sha" href="${
                                commit.sha
                            }">${commit.sha.substr(0, 10)}</a>
                        </p>
                    </div>
                `
                )
                .style('left', `${ev.pageX - 30}px`)
                .style('top', `${ev.pageY + 20}px`);
        },
        onMouseOut: () => {
            tooltip
                .transition()
                .duration(500)
                .style('opacity', 0)
                .style('pointer-events', 'none');
        },
    },
});

d3.select('#eventdrops-demo').call(chart);

updateCommitsInformation(chart);
