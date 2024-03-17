import { announceEpisode } from "./announceEpisode";
import { DebugLevel, debug, makeCodeBlock } from "./debug";
import { getLanguage, scrapePage } from "./utils";

// TODO break
for (const type of [1, 2, 3]) {
	let page = 2;
	while (true) {
		await debug(
			DebugLevel.Info,
			makeCodeBlock(`Scraping type ${getLanguage(type)} page 1`),
		);
		await scrapePage({
			type,
			page,
			onNewEpisode: announceEpisode,
		});
		page++;
	}
}

process.exit(0);
