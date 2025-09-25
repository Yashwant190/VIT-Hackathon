import React from 'react';
import { useState } from 'react';
import { Moon, Sun, Globe, Key, Bell, Shield, User, Palette, Database, Download, Trash2, AlertTriangle, Mail, Phone, Building, Briefcase } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { UserData } from './LoginDialog';
import { useTranslation } from '../i18n/i18n';

interface SettingsTabProps {
  clearAllData?: () => void;
  exportData?: () => void;
  documents?: Array<any>;
  darkMode?: boolean;
  setDarkMode?: (darkMode: boolean) => void;
  userData?: UserData | null;
  updateUserProfile?: (userData: UserData) => void;
  autoProcessing?: boolean;
  setAutoProcessing?: (autoProcessing: boolean) => void;
}

export function SettingsTab({ 
  clearAllData, 
  exportData, 
  documents = [], 
  darkMode = false, 
  setDarkMode,
  userData,
  updateUserProfile,
  autoProcessing = true,
  setAutoProcessing
}: SettingsTabProps) {
  const [notifications, setNotifications] = useState(true);
  const [apiKey, setApiKey] = useState('');
  const { t, lang, setLang, languages } = useTranslation();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-300">{t('settings.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Profile Information */}
        {userData && (
          <Card className="bg-gradient-to-br from-white to-blue-50/30 dark:from-gray-800 dark:to-blue-950/30 border-blue-100 dark:border-blue-800 shadow-lg shadow-blue-100/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-blue-600" />
                <span>User Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 rounded-lg">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {userData.username.split(' ').map(n => n[0]).join('').toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{userData.username}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{userData.role}</p>
                  <Badge variant="secondary" className="mt-1">
                    Member since {formatDate(userData.createdAt)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-center space-x-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Email</Label>
                    <p className="font-medium text-gray-900 dark:text-white">{userData.email}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Phone</Label>
                    <p className="font-medium text-gray-900 dark:text-white">{userData.phone}</p>
                  </div>
                </div>

                {userData.company && (
                  <div className="flex items-center space-x-3">
                    <Building className="w-4 h-4 text-gray-500" />
                    <div>
                      <Label className="text-sm text-gray-500 dark:text-gray-400">Company</Label>
                      <p className="font-medium text-gray-900 dark:text-white">{userData.company}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center space-x-3">
                  <Briefcase className="w-4 h-4 text-gray-500" />
                  <div>
                    <Label className="text-sm text-gray-500 dark:text-gray-400">Role</Label>
                    <p className="font-medium text-gray-900 dark:text-white">{userData.role}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Appearance Settings */}
        <Card className="bg-gradient-to-br from-white to-emerald-50/30 dark:from-gray-800 dark:to-emerald-950/30 border-emerald-100 dark:border-emerald-800 shadow-lg shadow-emerald-100/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Palette className="w-5 h-5 text-emerald-600" />
              <span>{t('settings.appearance')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {darkMode ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-yellow-600" />
                )}
                <div>
                  <Label className="text-base">{t('settings.darkMode')}</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.darkMode.hint')}</p>
                </div>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <Label className="text-base flex items-center space-x-2">
                <Globe className="w-4 h-4" />
                <span>{t('settings.language')}</span>
              </Label>
              <Select value={lang} onValueChange={(v) => setLang(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('settings.selectLanguage')} />
                </SelectTrigger>
                <SelectContent>
                  {languages.map((l) => (
                    <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Processing & Notification Settings */}
        <Card className="bg-gradient-to-br from-white to-purple-50/30 dark:from-gray-800 dark:to-purple-950/30 border-purple-100 dark:border-purple-800 shadow-lg shadow-purple-100/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-600" />
              <span>{t('settings.procNotif')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">{t('settings.autoProcessing')}</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.autoProcessing.hint')}</p>
              </div>
              <Switch
                checked={autoProcessing}
                onCheckedChange={setAutoProcessing}
              />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">{t('settings.pushNotifications')}</Label>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.pushNotifications.hint')}</p>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-purple-900 dark:text-purple-200">{t('settings.aiStatus.title')}</h4>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    {autoProcessing ? t('settings.aiStatus.auto') : t('settings.aiStatus.manual')}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Configuration */}
        <Card className="bg-gradient-to-br from-white to-orange-50/30 dark:from-gray-800 dark:to-orange-950/30 border-orange-100 dark:border-orange-800 shadow-lg shadow-orange-100/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="w-5 h-5 text-orange-600" />
              <span>{t('settings.api.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="api-key">{t('settings.api.key')}</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.api.keyHint')}</p>
            </div>

            <Separator />

            <div className="bg-orange-50 dark:bg-orange-950/50 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <Shield className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900 dark:text-orange-200">{t('settings.api.security.title')}</h4>
                  <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">{t('settings.api.security.desc')}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Statistics */}
        <Card className="bg-gradient-to-br from-white to-teal-50/30 dark:from-gray-800 dark:to-teal-950/30 border-teal-100 dark:border-teal-800 shadow-lg shadow-teal-100/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-teal-600" />
              <span>Account Statistics</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gradient-to-r from-teal-50 to-blue-50 dark:from-teal-950 dark:to-blue-950 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Premium Plan</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Unlimited documents, priority processing</p>
                </div>
                <Badge className="bg-gradient-to-r from-teal-600 to-blue-600 text-white">
                  Active
                </Badge>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">Usage Statistics</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-teal-50 dark:bg-teal-950/50 p-3 rounded-lg text-center">
                  <p className="text-lg font-semibold text-teal-600">{documents.length}</p>
                  <p className="text-sm text-teal-700 dark:text-teal-300">Documents Processed</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/50 p-3 rounded-lg text-center">
                  <p className="text-lg font-semibold text-blue-600">
                    {Math.round(documents.filter(d => d.summary).reduce((acc, doc) => acc + (parseInt(doc.summary?.readingTime || '0') * 0.7), 0))}h
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">Time Saved</p>
                </div>
                <div className="bg-purple-50 dark:bg-purple-950/50 p-3 rounded-lg text-center">
                  <p className="text-lg font-semibold text-purple-600">
                    {documents.filter(d => d.status === 'completed').length}
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300">Completed</p>
                </div>
                <div className="bg-green-50 dark:bg-green-950/50 p-3 rounded-lg text-center">
                  <p className="text-lg font-semibold text-green-600">
                    {Math.round((documents.filter(d => d.status === 'completed').length / Math.max(documents.length, 1)) * 100)}%
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">Success Rate</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Admin Data Management */}
        <Card className="bg-gradient-to-br from-white to-red-50/30 dark:from-gray-800 dark:to-red-950/30 border-red-100 dark:border-red-800 shadow-lg shadow-red-100/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5 text-red-600" />
              <span>{t('settings.data.title')}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-950/50 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-yellow-900 dark:text-yellow-200">Admin Functions</h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    These actions are permanent and cannot be undone. Use with caution.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">{t('settings.data.exportAll')}</Label>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t('settings.data.exportHint')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportData}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>{t('settings.data.export')}</span>
                </Button>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base text-red-700 dark:text-red-400">{t('settings.data.clearAll')}</Label>
                  <p className="text-sm text-red-500 dark:text-red-400">{t('settings.data.clearHint')}</p>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAllData}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t('settings.actions.clearAll')}</span>
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{documents.length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Total Documents</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">{documents.filter(d => d.status === 'completed').length}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700 shadow-lg shadow-gray-200/50">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex space-x-3">
              <Button className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 shadow-lg shadow-blue-200">
                {t('settings.actions.save')}
              </Button>
              <Button variant="outline">
                {t('settings.actions.reset')}
              </Button>
            </div>
            
            <div className="flex space-x-3">
              <Button variant="outline" onClick={exportData}>
                {t('settings.actions.exportData')}
              </Button>
              <Button variant="destructive" onClick={clearAllData}>
                {t('settings.actions.clearAll')}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}