import { AssetService } from '../services/api.js';
import { AssetView } from '../views/AssetView.js';

export const AssetController = {
    async init() {
        const assets = await AssetService.getAssets();
        AssetView.render(assets);
    }
};