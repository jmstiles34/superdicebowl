import { writable } from "svelte/store";
import { DEFAULT_SETTINGS } from '../lib/constants/constants';

export const settings = writable(DEFAULT_SETTINGS);