import React, { useCallback, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { createNoise2D } from "simplex-noise"
import * as THREE from "three"

// Default values
const DEFAULT_WAVE_SPEED = 0.6
const DEFAULT_ROTATION_SPEED = 0.001
const DEFAULT_WAVE_AMPLITUDE = 0.41
const DEFAULT_WAVE_LENGTH = 0.61
const DEFAULT_SEGMENTS = 512
const DEFAULT_MIN_RADIUS = 0.01
const DEFAULT_MAX_RADIUS = 1.95
const DEFAULT_AMPLITUDE_CHANGE_RATE = 0.8
const DEFAULT_SPIKE_LOCATIONS = [0, 90, 180, 270]
const DEFAULT_SPIKE_AMPLITUDE_FACTOR = 1.0
const DEFAULT_SPIKE_COVERAGE = 0

// zOffset values
const Z_OFFSET_1 = 0.1
const Z_OFFSET_2 = -0.1

// Other constants
const RADIUS_OFFSET = 0.5
const TWO_PI = Math.PI * 2
const MAX_AMPLITUDE = 0.8
const FULL_CIRCLE_DEGREES = 360
const Z_POSITION_INDEX_FACTOR = 3 // Used for indexing the z-position in positionArray
const DEFAULT_POSITION = [0, 0, 0]

/**
 * This LineProps type extends THREE.Line properties by adding an optional ref property.
 * @typedef {Object} LineProps
 * @property {React.Ref<THREE.Line>} [ref] - An optional React ref that points to a THREE.Line object.
 */
type LineProps = Omit<THREE.Line, "ref"> & { ref?: React.Ref<THREE.Line> }

/**
 * This CircleProps interface extends LineProps and provides additional properties for customization of a Circle.
 * @typedef {Object} CircleProps
 * @property {Object} [line2] - Optional properties for the second line. If provided, these will override the default properties for the second line only.
 * @property {boolean} [colorize=false] - Whether to colorize the line or not.
 * @property {number} [waveSpeed=0.6] - The speed of wave propagation.
 * @property {number} [rotationSpeed=0.001] - The speed of rotation of the circle.
 * @property {number} [waveAmplitude=0.41] - The amplitude of the wave.
 * @property {number} [waveLength=0.61] - The length of the wave.
 * @property {number} [segments=512] - The number of segments in the circle.
 * @property {number} [minRadius=0.01] - The minimum radius of the circle.
 * @property {number} [maxRadius=1.95] - The maximum radius of the circle.
 * @property {boolean} [rotateBothDirections=false] - Whether to rotate the circle in both directions or not.
 * @property {number} [amplitudeChangeRate=0.8] - The rate at which the amplitude changes. A value of 1 means the amplitude remains the same.
 * @property {number[]} [spikeLocations=[0, 90, 180, 270]] - An array of degrees representing locations around the circle where the wave amplitude spikes.
 * @property {number} [spikeAmplitudeFactor=1] - Factor by which to increase the amplitude at spike locations. For example, a value of 2 will double the amplitude, and a value of 3 will triple it. Default is 1, which means the amplitude stays the same.
 * @property {number} [spikeCoverage=0] - Coverage in degrees around each spike location where the spike amplitude should apply. For example, a value of 10 means that the spike amplitude applies to vertices that are within 10 degrees on either side of each spike location. Default is 0, which means only the exact spike locations have increased amplitude.
 */
export interface CircleProps extends LineProps {
  id?: number
  line2?: Partial<CircleProps>
  colorize?: boolean
  waveSpeed?: number
  rotationSpeed?: number
  waveAmplitude?: number
  waveLength?: number
  segments?: number
  minRadius?: number
  maxRadius?: number
  rotateBothDirections?: boolean
  amplitudeChangeRate?: number
  spikeLocations?: number[]
  spikeAmplitudeFactor?: number
  spikeCoverage?: number
  cameraMovement?: boolean
  strokeSize?: number
  isStreamingUpdates?: boolean
  intersectionValues?: {
    spikeAmplitudeFactor: number
  }
}

/**
 * This CircleWaveProps interface extends CircleProps and provides an additional style property for customization of the CircleWave component.
 * @typedef {Object} CircleWaveProps
 * @property {React.CSSProperties} [style] - An optional CSS style object that can be applied to the CircleWave component.
 */
export interface CircleWaveProps extends CircleProps {
  style?: React.CSSProperties
}

/**
 * This LineWrapper component wraps a THREE.Line object and forwards a ref to it.
 * @param {LineProps} props - The properties of the LineWrapper component.
 * @param {React.Ref<THREE.Line>} ref - An optional React ref that points to a THREE.Line object.
 * @returns {React.Element} The LineWrapper component.
 */
const LineWrapper: React.FC<LineProps> = React.forwardRef<THREE.Line, LineProps>((props, ref) => {
  const internalRef = useRef<THREE.Line>(null)

  useEffect(() => {
    if (typeof ref === "function") {
      ref(internalRef.current)
    } else if (ref) {
      ref.current = internalRef.current
    }
  }, [internalRef, ref])

  return (
    <line ref={internalRef} {...props}>
      {props.children}
    </line>
  )
})

LineWrapper.displayName = "LineWrapper"

/**
 * The `Circle` component generates a circular wave using THREE.js and Simplex noise.
 * It supports customization of wave properties, colorization, and spike locations.
 * The `line2` property can be used to specify different properties for the second line.
 *
 * @example
 * <Circle
 *  line2={{ waveSpeed: 0.8, waveAmplitude: 0.6 }}
 *  colorize={true}
 *  waveSpeed={0.5}
 *  rotationSpeed={0.001}
 *  waveAmplitude={0.3}
 *  waveLength={0.5}
 *  segments={512}
 *  minRadius={0.1}
 *  maxRadius={1.95}
 *  rotateBothDirections={true}
 *  amplitudeChangeRate={0.8}
 *  spikeAmplitudeFactor={1.0}
 *  spikeLocations={[0, 90, 180, 270]}
 * />
 *
 * @param {CircleProps} props The properties of the Circle component.
 * @returns {React.Element} The Circle component.
 */
export const CircleWave = ({
  line2,
  colorize = false,
  waveSpeed = DEFAULT_WAVE_SPEED,
  rotationSpeed = DEFAULT_ROTATION_SPEED,
  waveAmplitude = DEFAULT_WAVE_AMPLITUDE,
  waveLength = DEFAULT_WAVE_LENGTH,
  segments = DEFAULT_SEGMENTS,
  minRadius = DEFAULT_MIN_RADIUS,
  maxRadius = DEFAULT_MAX_RADIUS,
  rotateBothDirections = false,
  amplitudeChangeRate = DEFAULT_AMPLITUDE_CHANGE_RATE,
  spikeLocations = DEFAULT_SPIKE_LOCATIONS,
  spikeAmplitudeFactor = DEFAULT_SPIKE_AMPLITUDE_FACTOR,
  spikeCoverage = DEFAULT_SPIKE_COVERAGE,
  cameraMovement = false,
  strokeSize = 1,
  isStreamingUpdates = false,
  ...props
}: CircleProps) => {
  const line1 = useRef<THREE.Line>(null)
  const line2Ref = useRef<THREE.Line>(null)
  const prevSpikeLocations = useRef(spikeLocations)

  const mouse = useRef({ x: 0, y: 0 })
  const heightTracking = useRef({})

  const noise2D1 = useMemo(() => createNoise2D(Math.random), [])
  const noise2D2 = useMemo(() => createNoise2D(Math.random), [])

  const line1Props = useMemo(
    () => ({
      id: 1,
      colorize,
      waveSpeed,
      rotationSpeed,
      waveAmplitude,
      waveLength,
      segments,
      minRadius,
      maxRadius,
      rotateBothDirections,
      amplitudeChangeRate,
      spikeLocations,
      spikeAmplitudeFactor,
      spikeCoverage,
      strokeSize,
      ...props
    }),
    [
      amplitudeChangeRate,
      colorize,
      maxRadius,
      minRadius,
      props,
      rotateBothDirections,
      rotationSpeed,
      segments,
      spikeAmplitudeFactor,
      spikeCoverage,
      spikeLocations,
      waveAmplitude,
      waveLength,
      waveSpeed,
      strokeSize
    ]
  )

  const line2Props = useMemo(
    () => ({
      ...line1Props,
      ...line2,
      id: 2
    }),
    [line1Props, line2]
  )

  const propBuckets = {
    1: line1Props,
    2: line2Props
  }

  const calculateRadius = useCallback(
    function calculateRadius() {
      const offset = RADIUS_OFFSET
      const canvasSize = Math.min(window.innerWidth, window.innerHeight)
      const radius = (canvasSize / 2) * (1 - offset)
      const clampedRadius = Math.min(Math.max(radius, minRadius), maxRadius)

      return clampedRadius
    },
    [maxRadius, minRadius]
  )

  const createWaveGeometry = useCallback(
    function createWaveGeometry(
      id: number,
      noise2D: (x: number, y: number) => number,
      zOffset: number
    ) {
      const prop = propBuckets[id]
      const {
        segments: propSegments = DEFAULT_SEGMENTS,
        waveAmplitude: propWaveAmplitude = DEFAULT_WAVE_AMPLITUDE,

        spikeCoverage: propSpikeCoverage = DEFAULT_SPIKE_COVERAGE
      } = prop

      const geometry = new THREE.BufferGeometry()
      const vertices: number[] = []
      const heights: number[] = []
      const colors: number[] = []
      const color = new THREE.Color()

      for (let i = 0; i <= propSegments; i++) {
        const segment = (i / propSegments) * Math.PI * 2
        const x = Math.cos(segment) * calculateRadius()
        const y = Math.sin(segment) * calculateRadius()
        const degree = (i / propSegments) * FULL_CIRCLE_DEGREES
        const targetAmplitude = noise2D(x, y) * propWaveAmplitude
        let currentAmplitude = targetAmplitude

        if (
          id === 1 &&
          spikeLocations.some(spike => Math.abs(degree - spike) <= propSpikeCoverage)
        ) {
          currentAmplitude *= spikeAmplitudeFactor
        } else if (
          id === 2 &&
          spikeLocations.some(spike => Math.abs(degree - spike) <= propSpikeCoverage)
        ) {
          currentAmplitude *= spikeAmplitudeFactor
        }

        vertices.push(x, y, zOffset)
        heights.push(currentAmplitude)

        color.setHSL(Math.random(), 1.0, 0.5) // Random color variation
        colors.push(color.r, color.g, color.b)
      }

      geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3))
      geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3))

      geometry.userData.heights = heights

      return geometry
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const geom1 = useMemo(
    () => createWaveGeometry(1, noise2D1, Z_OFFSET_1),
    [createWaveGeometry, noise2D1]
  )

  const geom2 = useMemo(
    () => createWaveGeometry(2, noise2D2, Z_OFFSET_2),
    [createWaveGeometry, noise2D2]
  )

  const material = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: !!line1Props.colorize,
        linewidth: line1Props.strokeSize
      }),
    [line1Props.colorize, line1Props.strokeSize]
  )

  const material2 = useMemo(
    () =>
      new THREE.LineBasicMaterial({
        vertexColors: !!line2Props.colorize,
        linewidth: line2Props?.strokeSize ?? line1Props.strokeSize
      }),
    [line1Props.strokeSize, line2Props.colorize, line2Props?.strokeSize]
  )

  useMemo(() => {
    const heights = geom1.userData.heights

    return heights.forEach((height, index) => {
      heightTracking.current[`1-${index}`] = height
    })
  }, [geom1])

  useMemo(() => {
    const heights = geom2.userData.heights

    return heights.forEach((height, index) => {
      heightTracking.current[`2-${index}`] = height
    })
  }, [geom2])

  const lines = [
    {
      ref: line1,
      geom: geom1,
      prop: {
        colorize,
        waveSpeed,
        rotationSpeed,
        waveAmplitude,
        waveLength,
        segments,
        minRadius,
        maxRadius,
        rotateBothDirections,
        amplitudeChangeRate,
        spikeLocations,
        spikeAmplitudeFactor,
        spikeCoverage,
        ...props
      }
    },
    { ref: line2Ref, geom: geom2, prop: line2Props }
  ]

  useEffect(() => {
    prevSpikeLocations.current = spikeLocations
  }, [spikeLocations])

  useEffect(() => {
    const updateMousePosition = event => {
      mouse.current.x = (event.clientX / window.innerWidth) * 2 - 1
      mouse.current.y = -(event.clientY / window.innerHeight) * 2 + 1
    }

    window.addEventListener("mousemove", updateMousePosition)

    return () => {
      window.removeEventListener("mousemove", updateMousePosition)
    }
  }, [])

  const minMove = -50
  const maxMove = 50
  const movementMultiplier = 0.2

  useFrame(state => {
    const time = state.clock.elapsedTime
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(mouse.current, state.camera)

    if (cameraMovement) {
      const targetX = mouse.current.x * 1
      const targetY = -mouse.current.y * 1

      // Check if mouse is near the edges of the window
      if (
        Math.abs(mouse.current.x) > 0.99 || // 10% from the left or right edge
        Math.abs(mouse.current.y) > 0.99 // 10% from the top or bottom edge
      ) {
        state.camera.position.x = THREE.MathUtils.lerp(state.camera.position.x, 0, 0.2)
        state.camera.position.y = THREE.MathUtils.lerp(state.camera.position.y, 0, 0.2)
      } else {
        state.camera.position.x = Math.max(
          minMove,
          Math.min(
            maxMove,
            state.camera.position.x + (targetX - state.camera.position.x) * movementMultiplier
          )
        )
        state.camera.position.y = Math.max(
          minMove,
          Math.min(
            maxMove,
            state.camera.position.y + (targetY - state.camera.position.y) * movementMultiplier
          )
        )
      }

      state.camera.lookAt(0, 0, 0)
    }

    lines.forEach(({ ref: line, prop }) => {
      const noise = prop.id === 2 ? noise2D2 : noise2D1

      if (!line.current) return

      const position = line.current.geometry.attributes.position
      const heights = line.current.geometry.userData.heights

      const intersects = raycaster.intersectObject(line.current)

      let spikeAmplitudeFactor = prop.spikeAmplitudeFactor
      let spikeLocations = prop.spikeLocations

      const spikeTransLerpValue =
        JSON.stringify(prevSpikeLocations.current) === JSON.stringify(prop.spikeLocations)
          ? 0.08
          : 0.9

      if (intersects.length > 0 && prop.intersectionValues) {
        const { point } = intersects[0]

        const cameraWorldPosition = new THREE.Vector3()
        const cameraWorldDirection = new THREE.Vector3()

        state.camera.getWorldPosition(cameraWorldPosition)
        state.camera.getWorldDirection(cameraWorldDirection)

        // Compute the vector from the camera to the intersection point
        const toPoint = new THREE.Vector3().subVectors(point, cameraWorldPosition)

        const projectedPoint = toPoint.projectOnVector(cameraWorldDirection)
        projectedPoint.x *= -1
        // Normalize the projected point to get it in normalized device coordinates (NDC)
        const pointNDC = new THREE.Vector3().copy(projectedPoint).normalize()

        const degreeMouse = Math.atan2(pointNDC.y, pointNDC.x) * (180 / Math.PI)
        const normalizedDegreeMouse = degreeMouse < 0 ? degreeMouse + 360 : degreeMouse

        spikeAmplitudeFactor = prop.intersectionValues.spikeAmplitudeFactor
        spikeLocations = [normalizedDegreeMouse]
      } else {
        spikeAmplitudeFactor = prop.spikeAmplitudeFactor
        spikeLocations = prop.spikeLocations
      }

      for (let i = 0; i < position.count; i++) {
        const segment = (i / prop.segments) * Math.PI * 2
        const vertexPolarAngle = segment + line.current.rotation.z

        // Calculate the angular distance from the spike locations
        let minDeltaAngle = Infinity
        for (const spikeLocation of spikeLocations) {
          let deltaAngle = vertexPolarAngle - spikeLocation * (Math.PI / 180)
          if (deltaAngle > Math.PI) deltaAngle -= 2 * Math.PI
          else if (deltaAngle < -Math.PI) deltaAngle += 2 * Math.PI

          minDeltaAngle = Math.min(minDeltaAngle, Math.abs(deltaAngle))
        }

        minDeltaAngle *= 180 / Math.PI

        const sigma = prop.spikeCoverage
        const gaussianFactor = Math.exp((-minDeltaAngle * minDeltaAngle) / (2 * sigma * sigma))

        const waveFactor = (i / prop.waveLength + time * prop.waveSpeed) * TWO_PI

        let newAmplitude = noise(i / prop.segments, time * prop.waveSpeed) * prop.waveAmplitude
        newAmplitude = Math.min(newAmplitude, MAX_AMPLITUDE)

        const rate = prop.amplitudeChangeRate ? Math.abs(Math.random() * 2 - 1) : 1
        newAmplitude *= rate

        if (intersects.length > 0 && prop.intersectionValues) {
          const intersectionSpikeAmplitudeFactor = prop.intersectionValues.spikeAmplitudeFactor
          newAmplitude *= 1 + (intersectionSpikeAmplitudeFactor - 1) * gaussianFactor
          heights[i] = THREE.MathUtils.lerp(heights[i], newAmplitude, 0.6)
        } else {
          newAmplitude *= 1 + (spikeAmplitudeFactor - 1) * gaussianFactor
          const previousHeight = heightTracking.current[`${1}-${i}`]

          if (previousHeight !== heights[i]) {
            if (isStreamingUpdates) {
              heights[i] = THREE.MathUtils.lerp(heights[i], newAmplitude, 0.6)
            } else {
              heights[i] = previousHeight
            }
          } else {
            heights[i] = THREE.MathUtils.lerp(heights[i], newAmplitude, 0.6)
          }
        }

        const positionArray = position.array as Float32Array
        positionArray[i * Z_POSITION_INDEX_FACTOR + 2] = THREE.MathUtils.lerp(
          positionArray[i * Z_POSITION_INDEX_FACTOR + 2],
          Math.sin(waveFactor) * heights[i],
          spikeTransLerpValue
        )
      }

      position.needsUpdate = true

      if (prop.rotateBothDirections) {
        if (prop === line2Props) {
          line.current.rotation.z += prop.rotationSpeed
        } else {
          line.current.rotation.z -= prop.rotationSpeed
        }
      } else {
        line.current.rotation.z += prop.rotationSpeed
      }
    })
  })

  return (
    <>
      <LineWrapper ref={line1}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <primitive object={geom1} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <primitive object={material} attach="material" />
      </LineWrapper>

      <LineWrapper ref={line2Ref}>
        {/* eslint-disable-next-line react/no-unknown-property */}
        <primitive object={geom2} />
        {/* eslint-disable-next-line react/no-unknown-property */}
        <primitive object={material2} attach="material" />
      </LineWrapper>
    </>
  )
}

/**
 * The `CircleWave` component renders a `Canvas` that contains a `Circle`.
 * It supports all the properties of `Circle` and additional CSS styles.
 * The `line2` property can be used to specify different properties for the second line.
 *
 * @example
 * <CircleWave
 *  line2={{ waveSpeed: 0.8, waveAmplitude: 0.6 }}
 *  colorize={true}
 *  waveSpeed={0.5}
 *  rotationSpeed={0.001}
 *  waveAmplitude={0.3}
 *  waveLength={0.5}
 *  segments={512}
 *  minRadius={0.1}
 *  maxRadius={1.95}
 *  rotateBothDirections={true}
 *  amplitudeChangeRate={0.8}
 *  spikeLocations={[0, 90, 180, 270]}
 *  style={{width: '100%', height: '100%'}}
 * />
 *
 * @param {CircleWaveProps} props The properties of the CircleWave component.
 * @returns {React.Element} The CircleWave component.
 */
export const CircleWaveCanvas = ({ style, ...props }: CircleWaveProps) => {
  return (
    <Canvas gl={{ alpha: true }} style={style}>
      <ambientLight />
      <pointLight />
      <CircleWave {...props} position={DEFAULT_POSITION} />
    </Canvas>
  )
}
