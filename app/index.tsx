import { Stack } from 'expo-router';
import { useEffect, useMemo } from 'react';
import {
	InteractionManager,
	type LayoutChangeEvent,
	type NativeScrollEvent,
	type NativeSyntheticEvent,
	StyleSheet,
	Text,
	View,
	useWindowDimensions,
} from 'react-native';

import { observable } from '@legendapp/state';
import { observer, useObservable } from '@legendapp/state/react';
import { useHeaderHeight } from '@react-navigation/elements';
import { LLAMA3_2_1B_QLORA_URL, useLLM } from 'react-native-executorch';
import Animated, {
	Extrapolation,
	interpolate,
	LinearTransition,
	runOnJS,
	type SharedValue,
	useAnimatedStyle,
	useSharedValue,
	withDelay,
	withTiming,
	FadeIn,
	withSequence,
	withRepeat,
} from 'react-native-reanimated';

const DATA = [
	{
		key: 1,
		content:
			'On a sweltering summer afternoon, a young woman stood alone on the platform of an old train station. Her white dress swayed in the breeze, and her long black hair brushed against her cheeks. In her hand, she clutched an aged leather trunk. On the deserted platform, only the distant towering cumulus clouds seemed to keep her company.',
	},
	{
		key: 2,
		content:
			"She had arrived in this rural town three days ago to sort through her grandmother's belongings. For someone who lived in the city, this place held special meaning—a treasure trove of childhood summer memories. But now, her grandmother's house stood empty, devoid of its former warmth and life.",
	},
	{
		key: 3,
		content:
			"In the attic, she had discovered a letter dated thirty years ago. It was addressed to her grandmother. When she saw the sender's name, her heart skipped a beat. The handwriting belonged to her grandfather, who had disappeared without a trace years ago. The envelope remained sealed, untouched by time.",
	},
	{
		key: 4,
		content:
			'When she picked up the letter, an old map slipped out. The yellowed paper showed a hand-drawn map of the town, marked with several red X\'s. In the corner, there was a hastily scribbled note that read, "The treasure lies in the final place."',
	},
	{
		key: 5,
		content:
			'Standing on the platform now, she found herself at a crossroads. Should she return to the city as planned, or unravel the mystery of this curious map? The letter remained unopened. Another gust of wind made the map tremble in her hands. In the distance, she could hear the approaching train.',
	},
];

const NUMBERS = Array.from({ length: 144 }, (_, i) => i + 1);

interface State {
	isEndReached: boolean;
	isGenerating: boolean;
}
const state$ = observable<State>({
	isEndReached: false,
	isGenerating: false,
});

interface CircleProps {
	footerComponentY: SharedValue<number>;
	i: number;
}

const Circle = observer(({ footerComponentY, i }: CircleProps) => {
	const isHigherThanThreshold$ = useObservable(false);
	const { width } = useWindowDimensions();
	const sideLength = width / 8;

	const dynamicStyles = useMemo(
		() => ({
			square: {
				width: sideLength,
				aspectRatio: 1,
			},
		}),
		[sideLength],
	);
	const rowNum = Math.floor((i - 0.5) / 8);
	const columnNum = (i - 1) % 8;

	const setStateCallback = () => {
		if (columnNum === 7) {
			setTimeout(() => {
				state$.isEndReached.set(false);
			}, 1000);
		}
	};

	const state = state$.get();

	const isEndReached = state.isEndReached;
	const isGenerating = state.isGenerating;
	useEffect(() => {
		if (footerComponentY.value + 150 >= sideLength * rowNum) {
			isHigherThanThreshold$.set(true);
		}
	});

	const isHigherThanThreshold = isHigherThanThreshold$.get();

	const animatedStyle = useAnimatedStyle(() => {
		if (isEndReached && !isGenerating) {
			const delay = columnNum * 100;
			const randomFactor = 0.5 + Math.random();
			return {
				opacity: withDelay(
					delay,
					withTiming(0.3, { duration: 1000 * randomFactor }, () => {
						runOnJS(setStateCallback)();
					}),
				),
			};
		}
		if (isEndReached && isGenerating && isHigherThanThreshold) {
			const delay = columnNum * 100;
			const rand = Math.random();
			const randomFactor = 0.5 + rand;

			return {
				opacity: withRepeat(
					withSequence(
						withDelay(
							delay,
							withTiming(0.3, { duration: 1000 * randomFactor }),
						),
						withTiming(1, { duration: 1000 * randomFactor }),
					),
					-1,
					false,
				),
			};
		}
		if (!isEndReached && !isGenerating) {
			return {
				opacity: interpolate(
					footerComponentY.value + 150,
					[sideLength * rowNum, sideLength * (rowNum + 1)],
					[0.3, 1],
					Extrapolation.CLAMP,
				),
			};
		}
		return {
			opacity: withTiming(0.3),
		};
	});

	return (
		<Animated.View
			style={[styles.circle, dynamicStyles.square, animatedStyle]}
		/>
	);
});

interface ListFooterComponentProps {
	footerComponentY: SharedValue<number>;
}

interface DynamicStyles {
	footerContainer: {
		height: number;
		marginBottom: number;
	};
	square: {
		width: number;
		aspectRatio: number;
	};
}

const ListFooterComponent = observer(
	({ footerComponentY }: ListFooterComponentProps) => {
		const headerHeight = useHeaderHeight();
		const { height, width } = useWindowDimensions();
		const sideLength = width / 8;

		const dynamicStyles = useMemo<DynamicStyles>(
			() => ({
				footerContainer: {
					height: height - headerHeight,
					marginBottom: -50,
				},
				square: {
					width: sideLength,
					aspectRatio: 1,
				},
			}),
			[height, headerHeight, sideLength],
		);

		return (
			<Animated.View
				style={[styles.footerContainer, dynamicStyles.footerContainer]}
			>
				{NUMBERS.map((i) => (
					<View
						key={i.toString()}
						style={[styles.squareContainer, dynamicStyles.square]}
					>
						<Circle footerComponentY={footerComponentY} i={i} />
					</View>
				))}
			</Animated.View>
		);
	},
);

const debounce = <T extends (...args: unknown[]) => unknown>(
	func: T,
	wait: number,
): ((...args: Parameters<T>) => void) => {
	let timeoutId: NodeJS.Timeout | null = null;

	return (...args: Parameters<T>) => {
		if (timeoutId) {
			clearTimeout(timeoutId);
		}

		timeoutId = setTimeout(() => {
			func(...args);
			timeoutId = null;
		}, wait);
	};
};

const Index = observer(() => {
	const data$ = useObservable(DATA);
	const isInitialRender$ = useObservable(true);
	const listItemsHeight$ = useObservable(0);
	const headerHeight = useHeaderHeight();
	const footerComponentY = useSharedValue(0);
	const llama = useLLM({
		modelSource: LLAMA3_2_1B_QLORA_URL,
		tokenizerSource: require('../assets/tokenizer.bin'),
		contextWindowLength: 6,
		systemPrompt: `Please generate five consecutive paragraphs, each approximately 250 characters in length. Create a coherent story with natural progression between paragraphs. Each paragraph should:
- Maintain consistent character development
- Include emotional and scenic descriptions
- Connect smoothly with adjacent paragraphs
- Contribute to an overall story arc with introduction, development, turning point, and conclusion`,
	});
	const contentContainerStyle = useMemo(
		() => ({
			paddingTop: headerHeight,
		}),
		[headerHeight],
	);

	const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
		const y = e.nativeEvent.contentOffset.y;
		footerComponentY.value = y - listItemsHeight$.get();
	};

	const renderItem = ({ item }: { item: { key: number; content: string } }) => {
		const handleLayout = (e: LayoutChangeEvent) => {
			const height = e.nativeEvent.layout.height;
			if (isInitialRender$.peek()) {
				listItemsHeight$.set((prev) => prev + height / 2);
			} else {
				listItemsHeight$.set((prev) => prev + height);
			}
		};
		return (
			<Animated.Text
				entering={FadeIn.delay(100 * ((item.key - 1) % 5))}
				style={styles.text}
				onLayout={handleLayout}
			>
				{item.content}
			</Animated.Text>
		);
	};

	const generateNewData = async () => {
		//const generateCount = generateCount$.peek();
		//const newItems = NEW_DATA.slice(generateCount * 5, generateCount * 5 + 4);
		//
		//data$.push(...newItems);
		//generateCount$.set((v) => v + 1);
		const data = data$.peek();
		const itemLength = data.length;
		const message = data[itemLength - 1].content;
		try {
			await llama.generate(message);
		} catch (error) {
			console.error(error);
		}
	};

	useEffect(() => {
		if (llama.response && !llama.isModelGenerating) {
			const newItems = llama.response
				.split('\n')
				.filter((content) => content.trim() !== '')
				.map((content, i) => ({
					key: i + 1 + data$.peek().length,
					content,
				}));
			data$.push(...newItems);
		}
	}, [llama.response, llama.isModelGenerating, data$]);

	useEffect(() => {
		state$.isGenerating.set(llama.isModelGenerating);
	}, [llama.isModelGenerating]);

	const debouncedEndReached = debounce(() => {
		if (llama.isModelGenerating) return;

		InteractionManager.runAfterInteractions(() => {
			isInitialRender$.set(false);
			state$.isEndReached.set(true);
			generateNewData();
		});
	}, 300);

	const handleEndReached = () => {
		debouncedEndReached();
	};

	return !llama.isModelReady ? (
		<View style={styles.container}>
			<Text style={{ color: 'white' }}>
				Loading...: {llama.downloadProgress.toFixed(2)}
			</Text>
		</View>
	) : (
		<View style={styles.container}>
			<Stack.Screen
				options={{
					headerTitle: 'Mystery of the Unopened Letter and Hidden Treasure',
				}}
			/>
			<Animated.FlatList
				contentContainerStyle={contentContainerStyle}
				data={data$.get()}
				keyExtractor={(item: { key: number; content: string }) =>
					item.key.toString()
				}
				ListFooterComponent={
					<ListFooterComponent footerComponentY={footerComponentY} />
				}
				onEndReached={handleEndReached}
				onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) =>
					handleScroll(e)
				}
				renderItem={renderItem}
				showsVerticalScrollIndicator={false}
				itemLayoutAnimation={LinearTransition}
			/>
		</View>
	);
});

export default Index;

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flex: 1,
		justifyContent: 'center',
		backgroundColor: 'black',
	},
	footerContainer: {
		flexDirection: 'row',
		flexWrap: 'wrap',
	},
	squareContainer: {
		padding: 16,
	},
	circle: {
		flex: 1,
		borderRadius: 100,
		backgroundColor: 'white',
	},
	text: {
		fontSize: 17,
		fontWeight: 'bold',
		paddingHorizontal: 16,
		paddingVertical: 8,
		color: 'white',
	},
});
