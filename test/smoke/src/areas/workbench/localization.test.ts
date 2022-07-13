/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import minimist = require('minimist');
import { Application, Quality } from '../../../../automation';
import { afterSuite, startApp } from '../../utils';

export function setup(args: minimist.ParsedArgs) {

	describe('Localization', () => {

		let app: Application | undefined = undefined;

		afterSuite(args, () => app);

		it(`starts with 'DE' locale and verifies title and viewlets text is in German`, async function () {
			if (this.defaultOptions.quality === Quality.Dev || this.defaultOptions.remote) {
				return this.skip();
			}

			app = await startApp(args, this.defaultOptions);

			await app.workbench.extensions.openExtensionsViewlet();
			await app.workbench.extensions.installExtension('ms-ceintl.vscode-language-pack-de', false);
			await app.restart({ extraArgs: ['--locale=DE'] });

			const result = await app.workbench.localization.getLocalizedStrings();
			const localeInfo = await app.workbench.localization.getLocaleInfo();

			await app.stop();
			app = undefined;

			if (localeInfo.locale === undefined || localeInfo.locale.toLowerCase() !== 'de') {
				throw new Error(`The requested locale for VS Code was not German. The received value is: ${localeInfo.locale === undefined ? 'not set' : localeInfo.locale}`);
			}

			if (localeInfo.language.toLowerCase() !== 'de') {
				throw new Error(`The UI language is not German. It is ${localeInfo.language}`);
			}

			if (result.open.toLowerCase() !== 'öffnen' || result.close.toLowerCase() !== 'schließen' || result.find.toLowerCase() !== 'finden') {
				throw new Error(`Received wrong German localized strings: ${JSON.stringify(result, undefined, 0)}`);
			}
		});
	});
}
