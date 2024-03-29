import type { SSTConfig } from 'sst';
import { MyStack } from './stacks/MyStack';

export default {
	config(_input) {
		return {
			name: 'kuvagalleria',
			region: 'eu-north-1',
			profile: _input.stage === 'production' ? 'eemeli-production' : 'eemeli-dev'
		};
	},
	stacks(app) {
		app.stack(MyStack);
		if (app.stage !== 'production') {
			app.setDefaultRemovalPolicy('destroy');
		}
	}
} satisfies SSTConfig;
