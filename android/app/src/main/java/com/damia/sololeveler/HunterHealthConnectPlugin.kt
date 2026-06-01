package com.damia.sololeveler

import android.content.Intent
import android.net.Uri
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.ActiveCaloriesBurnedRecord
import androidx.health.connect.client.records.DistanceRecord
import androidx.health.connect.client.records.ExerciseSessionRecord
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
import androidx.health.connect.client.time.TimeRangeFilter
import com.getcapacitor.JSArray
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.time.Duration
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

@CapacitorPlugin(name = "HunterHealthConnect")
class HunterHealthConnectPlugin : Plugin() {
    private val providerPackageName = "com.google.android.apps.healthdata"
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private var permissionLauncher: ActivityResultLauncher<Set<String>>? = null
    private var pendingPermissionCall: PluginCall? = null

    private val readPermissions = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(DistanceRecord::class),
        HealthPermission.getReadPermission(ActiveCaloriesBurnedRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(ExerciseSessionRecord::class)
    )

    override fun load() {
        permissionLauncher = activity.activityResultRegistry.register(
            "hunterHealthConnectPermissions",
            activity,
            PermissionController.createRequestPermissionResultContract()
        ) { granted ->
            val call = pendingPermissionCall ?: return@register
            pendingPermissionCall = null
            call.setKeepAlive(false)
            call.resolve(permissionResult(granted))
        }
    }

    @PluginMethod
    fun getStatus(call: PluginCall) {
        scope.launch {
            call.resolve(buildStatus())
        }
    }

    @PluginMethod
    fun requestHealthPermissions(call: PluginCall) {
        scope.launch {
            val status = buildStatus()
            if (status.getBool("available") != true) {
                call.resolve(status)
                return@launch
            }

            val granted = getGrantedPermissions()
            if (granted.containsAll(readPermissions)) {
                call.resolve(permissionResult(granted))
                return@launch
            }

            if (pendingPermissionCall != null) {
                call.reject("Prośba o uprawnienia Health Connect jest już aktywna.")
                return@launch
            }

            val launcher = permissionLauncher
            if (launcher == null) {
                call.reject("Nie udało się przygotować okna zgody Health Connect.")
                return@launch
            }

            pendingPermissionCall = call
            call.setKeepAlive(true)
            launcher.launch(readPermissions)
        }
    }

    @PluginMethod
    fun readTodaySummary(call: PluginCall) {
        scope.launch {
            val status = buildStatus()
            if (status.getBool("available") != true) {
                call.resolve(status)
                return@launch
            }

            val granted = getGrantedPermissions()
            if (!granted.containsAll(readPermissions)) {
                val result = permissionResult(granted)
                result.put("message", "Brakuje zgody Health Connect. Najpierw nadaj uprawnienia.")
                call.resolve(result)
                return@launch
            }

            try {
                call.resolve(readSummary())
            } catch (error: Exception) {
                call.reject("Nie udało się odczytać danych Health Connect: ${error.localizedMessage}", error)
            }
        }
    }

    @PluginMethod
    fun openSettings(call: PluginCall) {
        val opened = openHealthConnectScreen()
        val result = JSObject()
        result.put("opened", opened)
        result.put("message", if (opened) "Otwarto Health Connect." else "Nie znaleziono aplikacji Health Connect.")
        call.resolve(result)
    }

    private suspend fun buildStatus(): JSObject {
        val result = JSObject()
        val sdkStatus = HealthConnectClient.getSdkStatus(context)
        val available = sdkStatus == HealthConnectClient.SDK_AVAILABLE
        val needsUpdate = sdkStatus == HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED

        result.put("available", available)
        result.put("needsUpdate", needsUpdate)
        result.put("installed", available || needsUpdate)
        result.put("providerPackage", providerPackageName)
        result.put("permissionCount", readPermissions.size)

        if (available) {
            val granted = getGrantedPermissions()
            result.put("permissionsGranted", granted.containsAll(readPermissions))
            result.put("grantedCount", granted.intersect(readPermissions).size)
            result.put("message", if (granted.containsAll(readPermissions)) "Health Connect gotowy." else "Health Connect wymaga zgody.")
        } else {
            result.put("permissionsGranted", false)
            result.put("grantedCount", 0)
            result.put(
                "message",
                if (needsUpdate) "Health Connect wymaga instalacji lub aktualizacji." else "Health Connect niedostępny na tym urządzeniu."
            )
        }

        return result
    }

    private suspend fun getGrantedPermissions(): Set<String> {
        return withContext(Dispatchers.IO) {
            HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions()
        }
    }

    private fun permissionResult(granted: Set<String>): JSObject {
        val result = JSObject()
        val grantedCount = granted.intersect(readPermissions).size
        result.put("available", true)
        result.put("installed", true)
        result.put("needsUpdate", false)
        result.put("permissionsGranted", granted.containsAll(readPermissions))
        result.put("grantedCount", grantedCount)
        result.put("permissionCount", readPermissions.size)
        result.put(
            "message",
            if (granted.containsAll(readPermissions)) "Zgody Health Connect są aktywne." else "Nie wszystkie zgody Health Connect zostały nadane."
        )
        return result
    }

    private suspend fun readSummary(): JSObject = withContext(Dispatchers.IO) {
        val client = HealthConnectClient.getOrCreate(context)
        val zoneId = ZoneId.systemDefault()
        val start = LocalDate.now(zoneId).atStartOfDay(zoneId).toInstant()
        val end = Instant.now()
        val timeRange = TimeRangeFilter.between(start, end)

        val aggregate = client.aggregate(
            AggregateRequest(
                metrics = setOf(
                    StepsRecord.COUNT_TOTAL,
                    DistanceRecord.DISTANCE_TOTAL,
                    ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL
                ),
                timeRangeFilter = timeRange
            )
        )

        val heartRecords = client.readRecords(
            ReadRecordsRequest(
                recordType = HeartRateRecord::class,
                timeRangeFilter = timeRange
            )
        )

        val exerciseRecords = client.readRecords(
            ReadRecordsRequest(
                recordType = ExerciseSessionRecord::class,
                timeRangeFilter = timeRange
            )
        )

        val heartSamples = heartRecords.records.flatMap { it.samples }
        val heartValues = heartSamples.map { it.beatsPerMinute }
        val activeMinutes = exerciseRecords.records.sumOf {
            Duration.between(it.startTime, it.endTime).toMinutes().coerceAtLeast(0)
        }
        val origins = linkedSetOf<String>()
        heartRecords.records.forEach { origins.add(it.metadata.dataOrigin.packageName) }
        exerciseRecords.records.forEach { origins.add(it.metadata.dataOrigin.packageName) }

        val result = JSObject()
        val steps = aggregate[StepsRecord.COUNT_TOTAL] ?: 0L
        val distanceMeters = aggregate[DistanceRecord.DISTANCE_TOTAL]?.inMeters ?: 0.0
        val caloriesKcal = aggregate[ActiveCaloriesBurnedRecord.ACTIVE_CALORIES_TOTAL]?.inKilocalories ?: 0.0

        result.put("available", true)
        result.put("permissionsGranted", true)
        result.put("startTime", start.toString())
        result.put("endTime", end.toString())
        result.put("steps", steps)
        result.put("distanceMeters", distanceMeters)
        result.put("distanceKm", distanceMeters / 1000.0)
        result.put("activeCaloriesKcal", caloriesKcal)
        result.put("exerciseMinutes", activeMinutes)
        result.put("heartRateSamples", heartSamples.size)
        if (heartValues.isNotEmpty()) {
            result.put("heartRateAvg", heartValues.average())
            result.put("heartRateMin", heartValues.minOrNull())
            result.put("heartRateMax", heartValues.maxOrNull())
        }

        val dataOrigins = JSArray()
        origins.forEach { dataOrigins.put(it) }
        result.put("dataOrigins", dataOrigins)
        result.put("message", "Dane Health Connect odczytane lokalnie.")
        result
    }

    private fun openHealthConnectScreen(): Boolean {
        val actions = listOf(
            "androidx.health.ACTION_HEALTH_CONNECT_SETTINGS",
            "android.health.connect.action.HEALTH_HOME_SETTINGS"
        )

        for (action in actions) {
            val intent = Intent(action).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            if (intent.resolveActivity(context.packageManager) != null) {
                context.startActivity(intent)
                return true
            }
        }

        val launchIntent = context.packageManager.getLaunchIntentForPackage(providerPackageName)
        if (launchIntent != null) {
            launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            context.startActivity(launchIntent)
            return true
        }

        val marketIntent = Intent(
            Intent.ACTION_VIEW,
            Uri.parse("market://details?id=$providerPackageName")
        ).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (marketIntent.resolveActivity(context.packageManager) != null) {
            context.startActivity(marketIntent)
            return true
        }

        return false
    }
}
