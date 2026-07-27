import { useEffect, useState, useCallback } from 'react';
import { useFamilyStore } from '../../../store/useFamilyStore';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Smartphone, Trash2, RefreshCw, Plus, ShieldCheck } from 'lucide-react';
import { cn } from '../../../lib/utils';

/**
 * Interface for parents to manage linked devices and join codes.
 *
 * @usedBy SettingsModal
 */
export function DeviceManager() {
  const { family, devices, fetchFamily, fetchDevices, generateJoinCode, removeDevice, loading } =
    useFamilyStore();
  const [isGenerating, setIsGenerating] = useState(false);

  const loadData = useCallback(async () => {
    const familyId = await fetchFamily();
    if (familyId) {
      await fetchDevices(familyId);
    }
  }, [fetchFamily, fetchDevices]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await generateJoinCode();
    setIsGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Join Code Section */}
      <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-widest opacity-80">
              Link New Device
            </h4>
            <ShieldCheck className="h-5 w-5 opacity-50" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex-1 text-center">
              <span className="text-3xl font-black tracking-[0.5em] ml-[0.5em]">
                {family?.join_code || '------'}
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="h-14 w-14 rounded-2xl bg-white/10 hover:bg-white/20 text-white border-none"
            >
              <RefreshCw className={cn('h-6 w-6', isGenerating && 'animate-spin')} />
            </Button>
          </div>

          <p className="text-[10px] font-medium opacity-70 leading-tight">
            Enter this code on another device to link it to your family account. Expires in 24
            hours.
          </p>
        </div>
        <Plus className="absolute -bottom-4 -right-4 h-24 w-24 opacity-10 rotate-12" />
      </div>

      {/* Devices List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Linked Devices
          </h4>
          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            {devices.length} / {family?.subscription_tier === 'premium' ? 5 : 2}
          </span>
        </div>

        <div className="grid gap-2">
          {devices.map((device) => (
            <Card key={device.id} className="p-3 border-slate-100 shadow-none bg-slate-50/50">
              <div className="flex items-center justify-between gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shrink-0">
                  <Smartphone className="h-5 w-5 text-slate-400" />
                </div>

                <div className="flex-1 min-w-0">
                  <h5 className="text-sm font-bold text-slate-800 truncate">{device.name}</h5>
                  <p className="text-[10px] text-slate-400 italic">
                    Active Sync ID: {device.id.slice(0, 8)}...
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                  onClick={() => removeDevice(device.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}

          {devices.length === 0 && !loading && (
            <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl">
              <p className="text-[11px] text-slate-400 font-medium italic">
                No other devices linked yet.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
